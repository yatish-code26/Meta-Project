/**
 * Curated Airport Reference Dataset
 * Real IATA codes, coordinates for Great Circle arcs, standard hub MCTs,
 * Schengen border status, and standard IANA time zones.
 */

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  ianaZone: string;
  defaultMctMinutes: number;
  isSchengen: boolean;
}

export const MAJOR_AIRPORTS: Airport[] = [
  // European Hubs
  {
    iata: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    lat: 51.4700,
    lon: -0.4543,
    ianaZone: 'Europe/London',
    defaultMctMinutes: 60,
    isSchengen: false,
  },
  {
    iata: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    lat: 50.0379,
    lon: 8.5622,
    ianaZone: 'Europe/Berlin',
    defaultMctMinutes: 45,
    isSchengen: true,
  },
  {
    iata: 'MUC',
    name: 'Munich Airport',
    city: 'Munich',
    country: 'Germany',
    lat: 48.3537,
    lon: 11.7750,
    ianaZone: 'Europe/Berlin',
    defaultMctMinutes: 40,
    isSchengen: true,
  },
  {
    iata: 'CDG',
    name: 'Paris Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    lat: 49.0097,
    lon: 2.5479,
    ianaZone: 'Europe/Paris',
    defaultMctMinutes: 60,
    isSchengen: true,
  },
  {
    iata: 'AMS',
    name: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    lat: 52.3105,
    lon: 4.7683,
    ianaZone: 'Europe/Amsterdam',
    defaultMctMinutes: 50,
    isSchengen: true,
  },
  {
    iata: 'ZRH',
    name: 'Zurich Airport',
    city: 'Zurich',
    country: 'Switzerland',
    lat: 47.4582,
    lon: 8.5555,
    ianaZone: 'Europe/Zurich',
    defaultMctMinutes: 40,
    isSchengen: true,
  },
  {
    iata: 'VIE',
    name: 'Vienna International Airport',
    city: 'Vienna',
    country: 'Austria',
    lat: 48.1103,
    lon: 16.5697,
    ianaZone: 'Europe/Vienna',
    defaultMctMinutes: 30,
    isSchengen: true,
  },

  // Asian & Middle East Hubs
  {
    iata: 'HND',
    name: 'Tokyo Haneda Airport',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.5494,
    lon: 139.7798,
    ianaZone: 'Asia/Tokyo',
    defaultMctMinutes: 50,
    isSchengen: false,
  },
  {
    iata: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.7720,
    lon: 140.3929,
    ianaZone: 'Asia/Tokyo',
    defaultMctMinutes: 60,
    isSchengen: false,
  },
  {
    iata: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    lat: 1.3644,
    lon: 103.9915,
    ianaZone: 'Asia/Singapore',
    defaultMctMinutes: 45,
    isSchengen: false,
  },
  {
    iata: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    lat: 25.2532,
    lon: 55.3657,
    ianaZone: 'Asia/Dubai',
    defaultMctMinutes: 60,
    isSchengen: false,
  },
  {
    iata: 'DOH',
    name: 'Hamad International Airport',
    city: 'Doha',
    country: 'Qatar',
    lat: 25.2731,
    lon: 51.6081,
    ianaZone: 'Asia/Qatar',
    defaultMctMinutes: 45,
    isSchengen: false,
  },
  {
    iata: 'ICN',
    name: 'Incheon International Airport',
    city: 'Seoul',
    country: 'South Korea',
    lat: 37.4602,
    lon: 126.4407,
    ianaZone: 'Asia/Seoul',
    defaultMctMinutes: 45,
    isSchengen: false,
  },

  // North American Hubs
  {
    iata: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    lat: 40.6413,
    lon: -73.7781,
    ianaZone: 'America/New_York',
    defaultMctMinutes: 75,
    isSchengen: false,
  },
  {
    iata: 'EWR',
    name: 'Newark Liberty International Airport',
    city: 'New York',
    country: 'United States',
    lat: 40.6895,
    lon: -74.1745,
    ianaZone: 'America/New_York',
    defaultMctMinutes: 60,
    isSchengen: false,
  },
  {
    iata: 'ORD',
    name: "O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    lat: 41.9742,
    lon: -87.9073,
    ianaZone: 'America/Chicago',
    defaultMctMinutes: 55,
    isSchengen: false,
  },
  {
    iata: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    lat: 37.6213,
    lon: -122.3790,
    ianaZone: 'America/Los_Angeles',
    defaultMctMinutes: 50,
    isSchengen: false,
  },
  {
    iata: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    lat: 33.9416,
    lon: -118.4085,
    ianaZone: 'America/Los_Angeles',
    defaultMctMinutes: 60,
    isSchengen: false,
  },
];

export const AIRPORTS: Airport[] = MAJOR_AIRPORTS;

export function getAirportByIata(iata: string): Airport | undefined {
  const code = iata.trim().toUpperCase();
  return MAJOR_AIRPORTS.find((a) => a.iata === code);
}

export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return MAJOR_AIRPORTS.slice(0, 8);
  return MAJOR_AIRPORTS.filter(
    (a) =>
      a.iata.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
  );
}
