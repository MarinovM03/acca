import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-crest',
  templateUrl: './crest.html',
  styleUrl: './crest.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Crest {
  readonly src = input<string | null>(null);
  readonly alt = input<string>('');
  readonly size = input<number>(20);

  private readonly errored = signal(false);

  protected readonly visible = computed(() => !!this.src() && !this.errored());

  protected onError(): void {
    this.errored.set(true);
  }
}
