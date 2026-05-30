import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Tables } from './tables';
import {
  CompetitionsService,
  Scorer,
  StandingsGroup,
} from '../../../core/services/competitions.service';

const GROUPS: StandingsGroup[] = [
  {
    label: null,
    table: [
      {
        position: 1,
        team: { external_id: 57, name: 'Arsenal FC', logo_url: null },
        played: 38,
        won: 26,
        draw: 7,
        lost: 5,
        goals_for: 71,
        goals_against: 27,
        goal_difference: 44,
        points: 85,
      },
    ],
  },
];

const SCORERS: Scorer[] = [
  {
    player_id: 1,
    player_name: 'Erling Haaland',
    nationality: 'Norway',
    team_name: 'Manchester City',
    team_crest: null,
    goals: 27,
    assists: 8,
    played_matches: 31,
  },
];

describe('Tables', () => {
  function configure(mock: Partial<CompetitionsService>) {
    TestBed.configureTestingModule({
      imports: [Tables],
      providers: [provideRouter([]), { provide: CompetitionsService, useValue: mock }],
    });
  }

  it('renders the standings table', () => {
    configure({ standings: () => of(GROUPS), scorers: () => of([]) });
    const fixture = TestBed.createComponent(Tables);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Arsenal FC');
    expect(text).toContain('85');
  });

  it('renders the top scorers section', () => {
    configure({ standings: () => of(GROUPS), scorers: () => of(SCORERS) });
    const fixture = TestBed.createComponent(Tables);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Erling Haaland');
  });

  it('shows an error when standings fail', () => {
    configure({ standings: () => throwError(() => new Error('boom')), scorers: () => of([]) });
    const fixture = TestBed.createComponent(Tables);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tables__status--error')).toBeTruthy();
  });
});
