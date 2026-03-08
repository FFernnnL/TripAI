export interface JwtPayload {
  userId: string;
  email: string;
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
    type: 'spot' | 'restaurant' | 'shopping' | 'entertainment';
  }>;
  restaurants: Array<{
    name: string;
    address: string;
    description: string;
    estimatedMinutes: number;
  }>;
  notes: string;
}
