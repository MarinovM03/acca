import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CompetitionsService,
  Scorer,
  StandingsGroup,
} from '../../../core/services/competitions.service';
import { COMPETITIONS, competitionName } from '../../../shared/competitions';
import { Crest } from '../../../shared/crest/crest';
import { LeagueTabs } from '../../../shared/league-tabs/league-tabs';

type StandingsState =
  | { kind: 'loading' }
  | { kind: 'loaded'; groups: StandingsGroup[] }
  | { kind: 'error' };

@Component({
  selector: 'app-tables',
  templateUrl: './tables.html',
  styleUrl: './tables.css',
  imports: [Crest, LeagueTabs, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tables implements OnInit {
  private readonly competitions = inject(CompetitionsService);

  protected readonly leagues = COMPETITIONS;
  protected readonly selected = signal(COMPETITIONS[0].id);
  protected readonly title = computed(() => competitionName(this.selected()));
  protected readonly standings = signal<StandingsState>({ kind: 'loading' });
  protected readonly scorers = signal<Scorer[]>([]);

  ngOnInit(): void {
    this.load();
  }

  select(id: number): void {
    if (id !== this.selected()) {
      this.selected.set(id);
      this.load();
    }
  }

  private load(): void {
    this.standings.set({ kind: 'loading' });
    this.scorers.set([]);
    this.competitions.standings(this.selected()).subscribe({
      next: (groups) => this.standings.set({ kind: 'loaded', groups }),
      error: () => this.standings.set({ kind: 'error' }),
    });
    this.competitions.scorers(this.selected()).subscribe({
      next: (scorers) => this.scorers.set(scorers),
      error: () => this.scorers.set([]),
    });
  }
}
