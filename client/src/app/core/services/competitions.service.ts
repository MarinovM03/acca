import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface StandingTeam {
  external_id: number;
  name: string;
  logo_url: string | null;
}

export interface StandingRow {
  position: number;
  team: StandingTeam;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface StandingsGroup {
  label: string | null;
  table: StandingRow[];
}

export interface Scorer {
  player_id: number;
  player_name: string;
  nationality: string | null;
  team_name: string | null;
  team_crest: string | null;
  goals: number | null;
  assists: number | null;
  played_matches: number | null;
}

export interface SquadPlayer {
  id: number;
  name: string;
  position: string | null;
  date_of_birth: string | null;
  nationality: string | null;
}

export interface TeamDetail {
  id: number;
  name: string;
  crest: string | null;
  country: string | null;
  founded: number | null;
  club_colors: string | null;
  venue: string | null;
  website: string | null;
  coach_name: string | null;
  squad: SquadPlayer[];
}

@Injectable({ providedIn: 'root' })
export class CompetitionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  standings(competitionId: number): Observable<StandingsGroup[]> {
    return this.http.get<StandingsGroup[]>(
      `${this.baseUrl}/competitions/${competitionId}/standings`,
    );
  }

  scorers(competitionId: number): Observable<Scorer[]> {
    return this.http.get<Scorer[]>(`${this.baseUrl}/competitions/${competitionId}/scorers`);
  }

  team(teamId: number): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(`${this.baseUrl}/teams/${teamId}`);
  }
}
