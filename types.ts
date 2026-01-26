
export interface GearItem {
  id: string;
  name: string;
  brand: string;
  type: 'brewer' | 'grinder' | 'espresso' | 'accessory';
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  location: string;
  email: string;
  phoneNumber?: string;
  stats: {
    totalBrews: number;
    streak: number;
    countriesVisited: number;
  };
  gear: {
    brewers: GearItem[];
    grinders: GearItem[];
  };
}

export interface Cafe {
  id: string;
  name: string;
  location: string;
  ratingAvg?: number;
  ratingCount?: number;
  imageUrl?: string;
  specialty?: string;
  mapsUri?: string;
  address?: string;
}

export interface Club {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  imageUrl?: string;
  location: string;
  ownerId: string;
  createdAt: string;
}

export interface CoffeeMatch {
  coffeeName: string;
  origin: string;
  roasters: string[];
  ratingAvg: number;
}

export interface Notification {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'like_brew' | 'like_cafe';
  targetName: string; 
  timestamp: string;
  isRead: boolean;
}

export interface BrewActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  timestamp: string;
  locationName: string;
  imageUrl?: string;
  roaster: string;
  beanOrigin: string;
  estate?: string;
  varietal?: string;
  process?: string;
  brewType?: 'espresso' | 'filter';
  brewer: string;
  grinder?: string;
  grindSetting?: string;
  ratio: string;
  gramsIn: number;
  gramsOut: number;
  brewWeight?: number;
  temperature: number;
  tempUnit: 'C' | 'F';
  brewTime: string;
  rating: number;
  comments: Comment[];
  isCafeLog?: boolean;
  cafeName?: string;
  isPrivate?: boolean;
  tds?: number;
  eyPercentage?: number;
  showParameters: boolean;
  likeCount: number;
  likedBy: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface CoffeeStat {
  day: string;
  count: number;
}

export interface CoffeeOffering {
  id: string;
  name: string;
  lot: string;
  origin: string;
  region?: string;
  estate?: string;
  varietals: string[];
  processing: string;
  roastLevel?: string;
  tastingNotes?: string[];
  elevation?: string;
  available: boolean;
  price?: number;
  size?: string;
  harvestDate?: string;
}

export interface Roaster {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  website?: string;
  foundedYear?: number;
  offerings: CoffeeOffering[];
}
