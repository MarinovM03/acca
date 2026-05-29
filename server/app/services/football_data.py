from datetime import date as date_type
from typing import Any

import httpx
from pydantic import BaseModel, Field

from app.core.config import get_settings


class FootballDataError(Exception):
    pass


class _Area(BaseModel):
    name: str | None = None


class _Competition(BaseModel):
    id: int
    name: str
    emblem: str | None = None


class _Team(BaseModel):
    id: int | None = None
    name: str | None = None
    crest: str | None = None


class _ScoreLine(BaseModel):
    home: int | None = None
    away: int | None = None


class _Score(BaseModel):
    full_time: _ScoreLine = Field(default_factory=_ScoreLine, alias="fullTime")


class _Match(BaseModel):
    id: int
    utc_date: str = Field(alias="utcDate")
    status: str
    area: _Area | None = None
    home_team: _Team = Field(alias="homeTeam")
    away_team: _Team = Field(alias="awayTeam")
    score: _Score = Field(default_factory=_Score)


class _MatchesResponse(BaseModel):
    competition: _Competition
    matches: list[_Match] = Field(default_factory=list)


class ParsedTeam(BaseModel):
    external_id: int
    name: str
    logo_url: str | None


class ParsedFixture(BaseModel):
    external_id: int
    league_external_id: int
    league_name: str
    league_country: str
    league_logo_url: str | None
    home: ParsedTeam
    away: ParsedTeam
    kickoff_at: str
    status: str
    home_goals: int | None
    away_goals: int | None


class FootballDataClient:
    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._client = http_client or httpx.AsyncClient(timeout=httpx.Timeout(10.0))
        self._owns_client = http_client is None

    async def __aenter__(self) -> "FootballDataClient":
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self.aclose()

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def fixtures_by_competition_and_date(
        self, *, competition_id: int, match_date: date_type
    ) -> list[ParsedFixture]:
        if not self._api_key:
            return []

        iso_date = match_date.isoformat()
        response = await self._client.get(
            f"{self._base_url}/competitions/{competition_id}/matches",
            params={"dateFrom": iso_date, "dateTo": iso_date},
            headers={"X-Auth-Token": self._api_key},
        )
        if response.status_code != 200:
            message = self._extract_message(response)
            raise FootballDataError(f"football-data.org HTTP {response.status_code}: {message}")

        body = _MatchesResponse.model_validate(response.json())
        return [self._normalise(body.competition, match) for match in body.matches]

    @staticmethod
    def _extract_message(response: httpx.Response) -> str:
        try:
            return str(response.json().get("message", response.text))
        except Exception:
            return response.text

    @staticmethod
    def _normalise(competition: _Competition, match: _Match) -> ParsedFixture:
        return ParsedFixture(
            external_id=match.id,
            league_external_id=competition.id,
            league_name=competition.name,
            league_country=(match.area.name if match.area else "") or "",
            league_logo_url=competition.emblem,
            home=ParsedTeam(
                external_id=match.home_team.id or 0,
                name=match.home_team.name or "Unknown",
                logo_url=match.home_team.crest,
            ),
            away=ParsedTeam(
                external_id=match.away_team.id or 0,
                name=match.away_team.name or "Unknown",
                logo_url=match.away_team.crest,
            ),
            kickoff_at=match.utc_date,
            status=match.status,
            home_goals=match.score.full_time.home,
            away_goals=match.score.full_time.away,
        )


def build_client() -> FootballDataClient:
    settings = get_settings()
    return FootballDataClient(
        base_url=settings.football_data_base_url,
        api_key=settings.football_data_api_key,
    )
