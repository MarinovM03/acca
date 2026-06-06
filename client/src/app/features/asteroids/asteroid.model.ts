export interface Asteroid {
  id: string;
  name: string;
  hazardous: boolean;
  diameter_min_m: number;
  diameter_max_m: number;
  approach_date: string;
  miss_distance_km: number;
  miss_distance_lunar: number;
  velocity_kps: number;
}
