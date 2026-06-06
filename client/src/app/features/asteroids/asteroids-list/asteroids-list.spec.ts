import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AsteroidsList } from './asteroids-list';
import { Asteroid } from '../asteroid.model';
import { AsteroidService } from '../asteroid.service';

function rock(id: string, name: string, hazardous: boolean): Asteroid {
  return {
    id,
    name,
    hazardous,
    diameter_min_m: 30,
    diameter_max_m: 60,
    approach_date: '2026-Jun-06 12:00',
    miss_distance_km: 250000,
    miss_distance_lunar: 0.65,
    velocity_kps: 18.5,
  };
}

function configure(serviceMock: Partial<AsteroidService>) {
  TestBed.configureTestingModule({
    imports: [AsteroidsList],
    providers: [{ provide: AsteroidService, useValue: serviceMock }],
  });
}

async function settle(fixture: ReturnType<typeof TestBed.createComponent>) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('AsteroidsList', () => {
  it('renders asteroids with a hazardous summary', async () => {
    configure({ getFeed: () => of([rock('1', 'Close One', true), rock('2', 'Calm One', false)]) });
    const fixture = TestBed.createComponent(AsteroidsList);
    await settle(fixture);

    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Close One');
    expect(text).toContain('1 potentially hazardous');
    expect(fixture.nativeElement.querySelector('.rock--hazard')).not.toBeNull();
  });

  it('shows an empty state when nothing is approaching', async () => {
    configure({ getFeed: () => of([]) });
    const fixture = TestBed.createComponent(AsteroidsList);
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain('No close approaches');
  });

  it('shows an error state with retry when loading fails', async () => {
    configure({ getFeed: () => throwError(() => new Error('boom')) });
    const fixture = TestBed.createComponent(AsteroidsList);
    await settle(fixture);

    expect(fixture.nativeElement.textContent).toContain("Couldn't load the asteroid feed");
    expect(fixture.nativeElement.querySelector('.neo__retry')).not.toBeNull();
  });
});
