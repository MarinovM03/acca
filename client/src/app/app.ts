import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { ApiService, HealthResponse } from './core/services/api.service';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly health = signal<HealthState>({ kind: 'loading' });

  ngOnInit(): void {
    this.api.health().subscribe({
      next: (data) => this.health.set({ kind: 'ok', data }),
      error: (err: unknown) =>
        this.health.set({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
    });
  }
}
