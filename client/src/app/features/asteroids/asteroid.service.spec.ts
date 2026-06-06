import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AsteroidService } from './asteroid.service';

describe('AsteroidService', () => {
  let service: AsteroidService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AsteroidService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the feed with start and end params', () => {
    service.getFeed('2026-06-06', '2026-06-12').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/asteroids'));
    expect(req.request.params.get('start')).toBe('2026-06-06');
    expect(req.request.params.get('end')).toBe('2026-06-12');
    req.flush([]);
  });
});
