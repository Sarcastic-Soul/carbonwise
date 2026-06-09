/**
 * Science-based emission factors used for carbon footprint calculations.
 * Sources: EPA, DEFRA (UK Government), IPCC, IEA
 * All values are in kg CO₂ equivalent (CO₂e).
 * @module constants
 */

/**
 * Transportation emission factors in kg CO₂e per kilometer.
 * @type {Object.<string, {factor: number, label: string, unit: string}>}
 */
export const TRANSPORT_FACTORS = Object.freeze({
  car_gasoline: { factor: 0.21, label: 'Car (Gasoline)', unit: 'km' },
  car_diesel: { factor: 0.27, label: 'Car (Diesel)', unit: 'km' },
  car_hybrid: { factor: 0.12, label: 'Car (Hybrid)', unit: 'km' },
  car_electric: { factor: 0.05, label: 'Car (Electric)', unit: 'km' },
  bus: { factor: 0.089, label: 'Public Bus', unit: 'km' },
  train: { factor: 0.041, label: 'Train / Metro', unit: 'km' },
  domestic_flight: { factor: 0.255, label: 'Domestic Flight', unit: 'km' },
  long_haul_flight: { factor: 0.195, label: 'Long-Haul Flight', unit: 'km' },
  motorcycle: { factor: 0.113, label: 'Motorcycle', unit: 'km' },
  bicycle: { factor: 0.0, label: 'Bicycle', unit: 'km' },
  walking: { factor: 0.0, label: 'Walking', unit: 'km' },
});

/**
 * Home energy emission factors in kg CO₂e per unit.
 * @type {Object.<string, {factor: number, label: string, unit: string}>}
 */
export const ENERGY_FACTORS = Object.freeze({
  electricity: { factor: 0.42, label: 'Electricity', unit: 'kWh' },
  natural_gas: { factor: 2.0, label: 'Natural Gas', unit: 'm³' },
  heating_oil: { factor: 2.52, label: 'Heating Oil', unit: 'litre' },
  lpg: { factor: 1.51, label: 'LPG', unit: 'litre' },
  wood: { factor: 0.39, label: 'Wood / Biomass', unit: 'kg' },
  solar: { factor: 0.0, label: 'Solar Power', unit: 'kWh' },
});

/**
 * Diet emission factors in kg CO₂e per day per person.
 * Based on peer-reviewed studies on dietary carbon footprints.
 * @type {Object.<string, {factor: number, label: string}>}
 */
export const DIET_FACTORS = Object.freeze({
  high_meat: { factor: 7.19, label: 'High Meat (daily)' },
  medium_meat: { factor: 5.63, label: 'Medium Meat (few times/week)' },
  low_meat: { factor: 4.67, label: 'Low Meat (once/week)' },
  pescatarian: { factor: 3.91, label: 'Pescatarian' },
  vegetarian: { factor: 3.81, label: 'Vegetarian' },
  vegan: { factor: 2.89, label: 'Vegan' },
});

/**
 * Shopping / consumption emission factors in kg CO₂e per item.
 * @type {Object.<string, {factor: number, label: string}>}
 */
export const SHOPPING_FACTORS = Object.freeze({
  clothing: { factor: 20, label: 'Clothing Item' },
  electronics_small: { factor: 50, label: 'Small Electronic Device' },
  electronics_large: { factor: 200, label: 'Large Electronic Device' },
  furniture: { factor: 100, label: 'Furniture Piece' },
  grocery_local: { factor: 0.5, label: 'Local Groceries (per kg)' },
  grocery_imported: { factor: 2.5, label: 'Imported Groceries (per kg)' },
});

/**
 * Global and national average annual carbon footprint per person (tonnes CO₂e).
 * Used for comparison and context in the dashboard.
 * @type {Object.<string, number>}
 */
export const BENCHMARK_AVERAGES = Object.freeze({
  global: 4.7,
  usa: 15.5,
  eu: 6.8,
  uk: 5.5,
  india: 1.9,
  china: 7.4,
  target_2030: 2.1,
});

/**
 * CO₂ equivalency factors for intuitive comparisons.
 * @type {Object.<string, {factor: number, label: string, unit: string}>}
 */
export const EQUIVALENCY_FACTORS = Object.freeze({
  trees_per_year: { factor: 21.77, label: 'Trees needed to offset (per year)', unit: 'trees' },
  driving_km: { factor: 4.76, label: 'Equivalent driving distance', unit: 'km' },
  flights_domestic: { factor: 0.0034, label: 'Domestic flights equivalent', unit: 'flights' },
  smartphone_charges: { factor: 125, label: 'Smartphone charges', unit: 'charges' },
  led_bulb_hours: { factor: 103, label: 'LED bulb hours', unit: 'hours' },
});

/**
 * HTTP status codes used in API responses.
 * @enum {number}
 */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
});

/**
 * Application-level constants.
 * @type {Object}
 */
export const APP_CONSTANTS = Object.freeze({
  APP_NAME: 'CarbonWise',
  APP_VERSION: '1.0.0',
  MAX_MESSAGE_LENGTH: 2000,
  MAX_CHAT_HISTORY: 20,
  DAYS_IN_YEAR: 365,
  WEEKS_IN_YEAR: 52,
  MONTHS_IN_YEAR: 12,
});
