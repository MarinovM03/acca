from collections.abc import AsyncIterator
from datetime import datetime

import httpx
import pytest
import pytest_asyncio
from fakeredis.aioredis import FakeRedis
from httpx import AsyncClient
from redis.asyncio import Redis

from app.db.redis import get_redis
from app.main import app
from app.routers.fixtures import get_football_client
from app.services.football_data import FootballDataClient

VALID_EMAIL = "martin@example.com"
VALID_PASSWORD = "correct-horse-battery-staple"
PL_ID = 2021


def _matches_payload() -> dict:
    return {
        "competition": {
            "id": PL_ID,
            "name": "Premier League",
            "emblem": "https://crests.football-data.org/PL.png",
        },
        "matches": [
            {
                "id": 497921,
                "utcDate": "2024-08-17T14:00:00Z",
                "status": "TIMED",
                "area": {"name": "England"},
                "homeTeam": {"id": 57, "name": "Arsenal FC", "crest": None},
                "awayTeam": {"id": 61, "name": "Chelsea FC", "crest": None},
                "score": {"fullTime": {"home": None, "away": None}},
            },
            {
                "id": 497922,
                "utcDate": "2024-08-17T16:30:00Z",
                "status": "FINISHED",
                "area": {"name": "England"},
                "homeTeam": {"id": 64, "name": "Liverpool FC", "crest": None},
                "awayTeam": {"id": 65, "name": "Manchester City FC", "crest": None},
                "score": {"fullTime": {"home": 1, "away": 1}},
            },
        ],
    }


@pytest_asyncio.fixture
async def fake_redis() -> AsyncIterator[Redis]:
    redis = FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest_asyncio.fixture
async def authenticated_client(
    client: AsyncClient, fake_redis: Redis
) -> AsyncIterator[AsyncClient]:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_matches_payload())

    fake_football = FootballDataClient(
        base_url="https://api.football-data.org/v4",
        api_key="test-key",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    async def override_redis() -> Redis:
        return fake_redis

    async def override_football() -> AsyncIterator[FootballDataClient]:
        yield fake_football

    app.dependency_overrides[get_redis] = override_redis
    app.dependency_overrides[get_football_client] = override_football

    await client.post("/auth/register", json={"email": VALID_EMAIL, "password": VALID_PASSWORD})
    login = await client.post(
        "/auth/login", json={"email": VALID_EMAIL, "password": VALID_PASSWORD}
    )
    token = login.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"

    yield client

    await fake_football.aclose()


@pytest.mark.asyncio
async def test_lists_fixtures_for_competition_and_date(authenticated_client: AsyncClient) -> None:
    response = await authenticated_client.get(
        "/fixtures", params={"competition_id": PL_ID, "date": "2024-08-17"}
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 2
    assert body[0]["league"]["name"] == "Premier League"
    assert body[0]["home_team"]["name"] == "Arsenal FC"
    assert body[0]["status"] == "scheduled"
    assert body[1]["status"] == "finished"
    assert body[1]["home_goals"] == 1


@pytest.mark.asyncio
async def test_requires_authentication(client: AsyncClient) -> None:
    response = await client.get("/fixtures", params={"competition_id": PL_ID, "date": "2024-08-17"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_second_call_is_cached(authenticated_client: AsyncClient) -> None:
    r1 = await authenticated_client.get(
        "/fixtures", params={"competition_id": PL_ID, "date": "2024-08-17"}
    )
    r2 = await authenticated_client.get(
        "/fixtures", params={"competition_id": PL_ID, "date": "2024-08-17"}
    )
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()


@pytest.mark.asyncio
async def test_uses_today_when_date_omitted(authenticated_client: AsyncClient) -> None:
    today = datetime.now().date().isoformat()
    response = await authenticated_client.get("/fixtures", params={"competition_id": PL_ID})
    assert response.status_code == 200
    assert f"acca:fixtures:{PL_ID}:{today}"
