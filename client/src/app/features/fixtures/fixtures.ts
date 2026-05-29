import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { Fixture, FixturesService } from '../../core/services/fixtures.service';

const PREMIER_LEAGUE_ID = 39;

type FixturesState =
  | { kind: 'loading' }
  | { kind: 'loaded'; fixtures: Fixture[] }
  | { kind: 'error' };

@Component({
  selector: 'app-fixtures',
  templateUrl: './fixtures.html',
  styleUrl: './fixtures.css',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Fixtures implements OnInit {
  private readonly fixturesService = inject(FixturesService);

  protected readonly state = signal<FixturesState>({ kind: 'loading' });

  ngOnInit(): void {
    this.fixturesService.list(PREMIER_LEAGUE_ID).subscribe({
      next: (fixtures) => this.state.set({ kind: 'loaded', fixtures }),
      error: () => this.state.set({ kind: 'error' }),
    });
  }
}
