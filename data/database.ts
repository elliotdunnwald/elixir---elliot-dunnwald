import brewingEquipmentData from './brewing-equipment.json';

export const PEERS = [];

export const ROASTERS = [
  { name: 'SEY COFFEE', location: 'BROOKLYN, USA' },
  { name: 'ONYX COFFEE LAB', location: 'BENTONVILLE, USA' },
  { name: 'PROUD MARY', location: 'PORTLAND, USA' },
  { name: 'LA CABRA', location: 'AARHUS, DENMARK' },
  { name: 'SQUARE MILE', location: 'LONDON, UK' },
  { name: 'TIM WENDELBOE', location: 'OSLO, NORWAY' },
  { name: 'MANHATTAN COFFEE ROASTERS', location: 'ROTTERDAM, NETHERLANDS' }
];

export const COFFEES = [
  {
    coffeeName: 'KIRU KAMAGOGO AA',
    origin: 'KENYA',
    roasters: ['SQUARE MILE'],
    ratingAvg: 4.9,
    varietals: ['SL28', 'SL34'],
    processing: 'WASHED',
    notes: ['LIME', 'BLACKCURRANT']
  }
];

export const CAFES = [];

export const CLUBS = [];

// Import brewing devices from JSON file for easier editing
export const BREWING_DEVICES = brewingEquipmentData.brewers;

// Available for future use
export const GRINDERS = brewingEquipmentData.grinders;
export const ACCESSORIES = brewingEquipmentData.accessories;
