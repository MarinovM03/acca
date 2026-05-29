import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Fixtures } from './fixtures';
import { Fixture, FixturesService } from '../../core/services/fixtures.service';

const FAKE_FIXTURE: Fixture = {
  id: 1,
  api_football_id: 1001,
  league: { id: 39, name: 'Premier League', country: 'England', logo_url: null },
  home_team: { id: 33, name: 'Manchester United', logo_url: null },
  away_team: { id: 34, name: 'Newcastle', logo_url: null },
  kickoff_at: '2026-05-28T15:00:00Z',
  status: 'scheduled',
  home_goals: null,
  away_goals: null,
};

describe('Fixtures', () => {
  function configure(mock: Partial<FixturesService>) {
    TestBed.configureTestingModule({
      imports: [Fixtures],
      providers: [{ provide: FixturesService, useValue: mock }],
    });
  }

  it('renders matches on success', () => {
    configure({ list: () => of([FAKE_FIXTURE]) });
    const fixture = TestBed.createComponent(Fixtures);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Manchester United');
    expect(text).toContain('Newcastle');
  });

  it('shows an empty-state message when there are no matches', () => {
    configure({ list: () => of([]) });
    const fixture = TestBed.createComponent(Fixtures);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No Premier League matches');
  });

  it('shows an error message on failure', () => {
    configure({ list: () => throwError(() => new Error('boom')) });
    const fixture = TestBed.createComponent(Fixtures);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.fixtures__status--error')).toBeTruthy();
  });
});
