from datetime import date

import httpx
import pytest

from app.services.football_data import FootballDataClient, FootballDataError

PL_ID = 2021


def _matches_payload(
    *,
    match_id: int = 497921,
    status: str = "SCHEDULED",
    home: tuple[int, str] = (57, "Arsenal FC"),
    away: tuple[int, str] = (61, "Chelsea FC"),
    home_goals: int | None = None,
    away_goals: int | None = None,
) -> dict:
    return {
        "competition": {
            "id": PL_ID,
            "name": "Premier League",
            "emblem": "https://crests.football-data.org/PL.png",
        },
        "matches": [
            {
                "id": match_id,
                "utcDate": "2024-08-17T14:00:00Z",
                "status": status,
                "area": {"name": "England"},
                "homeTeam": {"id": home[0], "name": home[1], "crest": None},
                "awayTeam": {"id": away[0], "name": away[1], "crest": None},
                "score": {"fullTime": {"home": home_goals, "away": away_goals}},
            }
        ],
    }


def _client(handler) -> FootballDataClient:
    return FootballDataClient(
        base_url="https://api.football-data.org/v4",
        api_key="secret",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )


@pytest.mark.asyncio
async def test_parses_matches_on_success() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v4/competitions/2021/matches"
        assert request.url.params.get("dateFrom") == "2024-08-17"
        assert request.url.params.get("dateTo") == "2024-08-17"
        assert request.headers["X-Auth-Token"] == "secret"
        return httpx.Response(
            200, json=_matches_payload(home_goals=2, away_goals=1, status="FINISHED")
        )

    rows = await _client(handler).fixtures_by_competition_and_date(
        competition_id=PL_ID, match_date=date(2024, 8, 17)
    )

    assert len(rows) == 1
    assert rows[0].external_id == 497921
    assert rows[0].league_name == "Premier League"
    assert rows[0].league_country == "England"
    assert rows[0].home.name == "Arsenal FC"
    assert rows[0].home_goals == 2
    assert rows[0].status == "FINISHED"


@pytest.mark.asyncio
async def test_empty_matches_returns_empty_list() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"competition": {"id": PL_ID, "name": "Premier League"}, "matches": []},
        )

    rows = await _client(handler).fixtures_by_competition_and_date(
        competition_id=PL_ID, match_date=date(2024, 8, 17)
    )
    assert rows == []


@pytest.mark.asyncio
async def test_forbidden_raises() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"message": "Restricted resource", "errorCode": 403})

    with pytest.raises(FootballDataError):
        await _client(handler).fixtures_by_competition_and_date(
            competition_id=PL_ID, match_date=date(2024, 8, 17)
        )


@pytest.mark.asyncio
async def test_rate_limited_raises() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"message": "Too many requests"})

    with pytest.raises(FootballDataError):
        await _client(handler).fixtures_by_competition_and_date(
            competition_id=PL_ID, match_date=date(2024, 8, 17)
        )


@pytest.mark.asyncio
async def test_no_api_key_returns_empty_without_calling() -> None:
    called = False

    def handler(_: httpx.Request) -> httpx.Response:
        nonlocal called
        called = True
        return httpx.Response(200, json=_matches_payload())

    client = FootballDataClient(
        base_url="https://api.football-data.org/v4",
        api_key="",
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )
    rows = await client.fixtures_by_competition_and_date(
        competition_id=PL_ID, match_date=date(2024, 8, 17)
    )
    assert rows == []
    assert called is False
