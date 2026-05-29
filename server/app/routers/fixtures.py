from collections.abc import AsyncIterator
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis
from app.db.session import get_db
from app.models.user import User
from app.schemas.fixtures import FixtureResponse
from app.services.auth import get_current_user
from app.services.cache import JsonCache
from app.services.fixtures import FixturesService
from app.services.football_data import FootballDataClient, build_client


async def get_football_client() -> AsyncIterator[FootballDataClient]:
    client = build_client()
    try:
        yield client
    finally:
        await client.aclose()


DbDep = Annotated[AsyncSession, Depends(get_db)]
RedisDep = Annotated[Redis, Depends(get_redis)]
FootballClientDep = Annotated[FootballDataClient, Depends(get_football_client)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]

router = APIRouter(prefix="/fixtures", tags=["fixtures"])


@router.get("", response_model=list[FixtureResponse])
async def list_fixtures(
    current_user: CurrentUserDep,
    db: DbDep,
    redis: RedisDep,
    football: FootballClientDep,
    competition_id: Annotated[int, Query()],
    match_date: Annotated[date | None, Query(alias="date")] = None,
) -> list[FixtureResponse]:
    target_date = match_date or datetime.now(UTC).date()
    service = FixturesService(db=db, cache=JsonCache(redis), client=football)
    return await service.list_for_competition_and_date(
        competition_id=competition_id, match_date=target_date
    )
