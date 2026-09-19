export interface TimeZoneOption {
  ianaZone: string;
  city: string;
  country: string;
}

/**
 * A curated, offline list rather than Intl.supportedValuesOf('timeZone') —
 * Hermes' support for that call is inconsistent across RN/Expo versions, and
 * this list also gives nicer, city-based search results than raw IANA ids
 * ("Mumbai" finds Asia/Kolkata). Covers the zones people actually pick for a
 * personal/family clock; extend as needed.
 */
export const TIMEZONE_OPTIONS: TimeZoneOption[] = [
  { ianaZone: "Asia/Kolkata", city: "Mumbai / Delhi / Hyderabad", country: "India" },
  { ianaZone: "Asia/Dubai", city: "Dubai", country: "UAE" },
  { ianaZone: "Asia/Singapore", city: "Singapore", country: "Singapore" },
  { ianaZone: "Asia/Tokyo", city: "Tokyo", country: "Japan" },
  { ianaZone: "Asia/Shanghai", city: "Shanghai / Beijing", country: "China" },
  { ianaZone: "Asia/Hong_Kong", city: "Hong Kong", country: "Hong Kong" },
  { ianaZone: "Asia/Seoul", city: "Seoul", country: "South Korea" },
  { ianaZone: "Asia/Bangkok", city: "Bangkok", country: "Thailand" },
  { ianaZone: "Asia/Jakarta", city: "Jakarta", country: "Indonesia" },
  { ianaZone: "Asia/Kuala_Lumpur", city: "Kuala Lumpur", country: "Malaysia" },
  { ianaZone: "Asia/Manila", city: "Manila", country: "Philippines" },
  { ianaZone: "Asia/Karachi", city: "Karachi", country: "Pakistan" },
  { ianaZone: "Asia/Dhaka", city: "Dhaka", country: "Bangladesh" },
  { ianaZone: "Asia/Kathmandu", city: "Kathmandu", country: "Nepal" },
  { ianaZone: "Asia/Colombo", city: "Colombo", country: "Sri Lanka" },
  { ianaZone: "Asia/Riyadh", city: "Riyadh", country: "Saudi Arabia" },
  { ianaZone: "Asia/Jerusalem", city: "Jerusalem / Tel Aviv", country: "Israel" },
  { ianaZone: "Europe/Istanbul", city: "Istanbul", country: "Turkey" },
  { ianaZone: "Europe/Moscow", city: "Moscow", country: "Russia" },
  { ianaZone: "Europe/London", city: "London", country: "United Kingdom" },
  { ianaZone: "Europe/Dublin", city: "Dublin", country: "Ireland" },
  { ianaZone: "Europe/Paris", city: "Paris", country: "France" },
  { ianaZone: "Europe/Berlin", city: "Berlin", country: "Germany" },
  { ianaZone: "Europe/Madrid", city: "Madrid", country: "Spain" },
  { ianaZone: "Europe/Rome", city: "Rome", country: "Italy" },
  { ianaZone: "Europe/Amsterdam", city: "Amsterdam", country: "Netherlands" },
  { ianaZone: "Europe/Zurich", city: "Zurich", country: "Switzerland" },
  { ianaZone: "Europe/Athens", city: "Athens", country: "Greece" },
  { ianaZone: "Europe/Warsaw", city: "Warsaw", country: "Poland" },
  { ianaZone: "Africa/Cairo", city: "Cairo", country: "Egypt" },
  { ianaZone: "Africa/Lagos", city: "Lagos", country: "Nigeria" },
  { ianaZone: "Africa/Johannesburg", city: "Johannesburg", country: "South Africa" },
  { ianaZone: "Africa/Nairobi", city: "Nairobi", country: "Kenya" },
  { ianaZone: "America/New_York", city: "New York", country: "USA (Eastern)" },
  { ianaZone: "America/Chicago", city: "Chicago", country: "USA (Central)" },
  { ianaZone: "America/Denver", city: "Denver", country: "USA (Mountain)" },
  { ianaZone: "America/Los_Angeles", city: "Los Angeles / San Francisco", country: "USA (Pacific)" },
  { ianaZone: "America/Anchorage", city: "Anchorage", country: "USA (Alaska)" },
  { ianaZone: "Pacific/Honolulu", city: "Honolulu", country: "USA (Hawaii)" },
  { ianaZone: "America/Toronto", city: "Toronto", country: "Canada" },
  { ianaZone: "America/Vancouver", city: "Vancouver", country: "Canada" },
  { ianaZone: "America/Mexico_City", city: "Mexico City", country: "Mexico" },
  { ianaZone: "America/Sao_Paulo", city: "São Paulo", country: "Brazil" },
  { ianaZone: "America/Buenos_Aires", city: "Buenos Aires", country: "Argentina" },
  { ianaZone: "America/Bogota", city: "Bogotá", country: "Colombia" },
  { ianaZone: "Australia/Sydney", city: "Sydney / Melbourne", country: "Australia (Eastern)" },
  { ianaZone: "Australia/Perth", city: "Perth", country: "Australia (Western)" },
  { ianaZone: "Australia/Adelaide", city: "Adelaide", country: "Australia (Central)" },
  { ianaZone: "Pacific/Auckland", city: "Auckland", country: "New Zealand" },
  { ianaZone: "Pacific/Fiji", city: "Suva", country: "Fiji" },
  { ianaZone: "Etc/UTC", city: "Coordinated Universal Time", country: "UTC" },
];
