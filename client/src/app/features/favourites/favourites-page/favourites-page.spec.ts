import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FavouritesPage } from './favourites-page';
import { Favourite, FavouriteService } from '../../../core/services/favourite.service';

function favourite(id: string, kind: string, payload: Record<string, unknown>): Favourite {
  return { id, kind, ref_id: id, payload, created_at: '2026-06-06T00:00:00Z' };
}

function configure(items: Favourite[]) {
  TestBed.configureTestingModule({
    imports: [FavouritesPage],
    providers: [
      provideRouter([]),
      {
        provide: FavouriteService,
        useValue: { items: signal(items).asReadonly(), remove: () => {} },
      },
    ],
  });
}

describe('FavouritesPage', () => {
  it('shows an empty state when there are no favourites', () => {
    configure([]);
    const fixture = TestBed.createComponent(FavouritesPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nothing saved yet');
  });

  it('lists saved items with their titles', () => {
    configure([
      favourite('2026-06-06', 'apod', { title: 'The Hydra Cluster' }),
      favourite('abc', 'launch', { name: 'Falcon 9 | Starlink' }),
    ]);
    const fixture = TestBed.createComponent(FavouritesPage);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('The Hydra Cluster');
    expect(text).toContain('Falcon 9 | Starlink');
    expect(fixture.nativeElement.querySelectorAll('.favcard').length).toBe(2);
  });
});
