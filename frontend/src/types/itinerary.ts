export interface DayItem {
  id: string;
  dayId: string;
  type: 'spot' | 'restaurant' | 'shopping' | 'entertainment';
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string;
  estimatedMinutes: number;
  orderIndex: number;
}

export interface ItineraryDay {
  id: string;
  itineraryId: string;
  dayNumber: number;
  date: string;
  theme: string;
  hotelName: string;
  hotelAddress: string;
  hotelLat: number | null;
  hotelLng: number | null;
  notes: string;
  orderIndex: number;
  items: DayItem[];
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  destinations: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  adults: number;
  children: number;
  preferences: string;
  status: string;
  aiSummary: string;
  createdAt: string;
  updatedAt: string;
  days: ItineraryDay[];
}

export interface GenerateRequest {
  destinations: string[];
  startDate: string;
  endDate: string;
  totalDays: number;
  adults: number;
  children: number;
  preferences: string;
}

export interface AIDayResult {
  dayNumber: number;
  theme: string;
  hotel: {
    name: string;
    address: string;
  };
  spots: Array<{
    name: string;
    address: string;
    description: string;
    estimatedMinutes: number;
    type: string;
  }>;
  restaurants: Array<{
    name: string;
    address: string;
    description: string;
    estimatedMinutes: number;
  }>;
  notes: string;
}

export interface RouteSegment {
  from: number;
  to: number;
  distance: number;
  duration: number;
  polyline: string;
}
