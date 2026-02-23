import { Injectable } from '@angular/core';
import { LastTripItem } from '../types/dashboard.type';

@Injectable({ providedIn: 'root' })
export class TripCacheService {
  private readonly STORAGE_KEY = 'admin_viewed_trips_cache';
  private cache = new Map<number, LastTripItem>();

  constructor() {
    this.loadFromLocalStorage();
  }

  set(tripId: number, trip: LastTripItem): void {
    // deep copy عشان ما يحصلش side effect
    this.cache.set(tripId, { ...trip });
    this.saveToLocalStorage();
  }

  get(tripId: number): LastTripItem | undefined {
    return this.cache.get(tripId);
  }

  // اختياري: تنظيف الرحلات القديمة (أكتر من 30 يوم)
  clearOldTrips(days: number = 30): void {
    const now = Date.now();
    const limit = days * 24 * 60 * 60 * 1000;
    for (const [id, trip] of this.cache) {
      const tripDate = new Date(trip.createdAt).getTime();
      if (now - tripDate > limit) {
        this.cache.delete(id);
      }
    }
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    const obj = Object.fromEntries(this.cache.entries());
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cache = new Map(
          Object.entries(parsed).map(([k, v]) => [Number(k), v as LastTripItem])
        );
      } catch (e) {
        console.warn('فشل تحميل كاش الرحلات');
      }
    }
  }
}
