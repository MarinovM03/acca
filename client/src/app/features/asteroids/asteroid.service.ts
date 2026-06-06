import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Asteroid } from './asteroid.model';

@Injectable({ providedIn: 'root' })
export class AsteroidService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getFeed(start: string, end: string): Observable<Asteroid[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http.get<Asteroid[]>(`${this.baseUrl}/asteroids`, { params });
  }
}
