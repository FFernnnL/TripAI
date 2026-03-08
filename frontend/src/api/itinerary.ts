import client from './client';
import type { Itinerary, DayItem } from '../types/itinerary';

export function getItineraries() {
  return client.get<Itinerary[]>('/api/itineraries');
}

export function getItinerary(id: string) {
  return client.get<Itinerary>(`/api/itineraries/${id}`);
}

export function updateItinerary(id: string, data: { title?: string; status?: string }) {
  return client.put(`/api/itineraries/${id}`, data);
}

export function deleteItinerary(id: string) {
  return client.delete(`/api/itineraries/${id}`);
}

export function batchUpdateItems(itineraryId: string, dayId: string, items: Array<{ id: string; orderIndex: number; [key: string]: any }>) {
  return client.put(`/api/itineraries/${itineraryId}/days/${dayId}/items`, { items });
}

export function addItem(itineraryId: string, dayId: string, item: Partial<DayItem>) {
  return client.post(`/api/itineraries/${itineraryId}/days/${dayId}/items`, item);
}

export function deleteItem(itineraryId: string, itemId: string) {
  return client.delete(`/api/itineraries/${itineraryId}/items/${itemId}`);
}

export function getDayRoute(itineraryId: string, dayId: string) {
  return client.get(`/api/itineraries/${itineraryId}/days/${dayId}/route`);
}

export function regeocode(itineraryId: string) {
  return client.post<{ success: boolean; updatedCount: number }>(`/api/itineraries/${itineraryId}/regeocode`);
}

export function createShareLink(itineraryId: string) {
  return client.post(`/api/itineraries/${itineraryId}/share`);
}

export function getSharedItinerary(token: string) {
  return client.get<Itinerary>(`/api/share/${token}`);
}

export function searchPlaces(keyword: string, city?: string) {
  return client.get('/api/itineraries/places/search', { params: { keyword, city } });
}
