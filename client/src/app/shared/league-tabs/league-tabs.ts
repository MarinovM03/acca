import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Competition } from '../competitions';
import { Crest } from '../crest/crest';

@Component({
  selector: 'app-league-tabs',
  templateUrl: './league-tabs.html',
  styleUrl: './league-tabs.css',
  imports: [Crest],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueTabs {
  readonly competitions = input.required<readonly Competition[]>();
  readonly selectedId = input.required<number>();
  readonly selected = output<number>();
}
