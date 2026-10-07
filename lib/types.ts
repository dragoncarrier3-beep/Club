export type Role = "member" | "admin" | "superadmin";
export type SocialKey = "twitch" | "discord" | "x" | "youtube" | "tiktok" | "instagram";

export interface Club {
  id: string;
  slug: string;
  name: string;
  short: string;
  tagline: string;
  accent: string; // "r g b"
  logo?: string;
  founded: number;
  league: string;
  about: { heading: string; body: string; values: string[]; image?: string };
  copyright: string;
  contact: { general: string; recruitment: string };
  socials: Record<SocialKey, string>;
  lastActivityAt: number;
  donationGoal: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  passHash: string;
  role: Role;
  clubId: string;
  status: "active" | "suspended" | "pending";
  createdAt: number;
  lastLoginAt?: number;
  psn?: string;
  discord?: string;
}

export interface News {
  id: string;
  clubId: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: number;
  status: "draft" | "published" | "archived";
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  title: string;
  type: "Match" | "Training" | "Trial" | "Tournament" | "Club Event";
  startsAt: number;
  competition?: string;
  description?: string;
  cancelled?: boolean;
}

export interface PlayerStats {
  apps: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  rating: number;
  motm: number;
  yellow: number;
  red: number;
}

export interface Player {
  id: string;
  clubId: string;
  gamerTag: string;
  firstName: string;
  lastName: string;
  eaId: string;
  position: string;
  kitNumber: number;
  nationality: string;
  image?: string;
  status: "active" | "archived";
  joinedAt: number;
  bio: string;
  stats: PlayerStats;
}

export interface Staff {
  id: string;
  clubId: string;
  name: string;
  role: string;
  psn: string;
  discord: string;
  bio: string;
  joinedAt: number;
  image?: string;
  order: number;
}

export interface Era {
  id: string;
  clubId: string;
  game: string;
  title: string;
  year: number;
  story: string;
  matches: number;
  wins: number;
  bestFinish: string;
  topScorer: string;
  achievements: string[];
  gallery: string[];
  image?: string;
  order: number;
}

export interface Match {
  id: string;
  clubId: string;
  opponent: string;
  home: boolean;
  gf: number;
  ga: number;
  competition: string;
  playedAt: number;
  scorers: string[];
  motm: string;
}

export interface LeagueRow {
  team: string;
  played: number;
  pts: number;
  isClub?: boolean;
}

export interface Trial {
  id: string;
  ref: string;
  clubId: string;
  realName: string;
  gamerTag: string;
  age: number;
  email: string;
  discord: string;
  psn: string;
  primaryPos: string;
  secondaryPos: string;
  formation: string;
  currentClub: string;
  previousClubs: string;
  compExp: string;
  leagueExp: string;
  availability: string;
  mic: string;
  connection: string;
  why: string;
  bring: string;
  strengths: string;
  improve: string;
  status: "New" | "Reviewing" | "Trial Offered" | "Accepted" | "Rejected";
  createdAt: number;
}

export interface Donation {
  id: string;
  clubId: string;
  amount: number;
  name: string;
  createdAt: number;
  status: "succeeded";
}

export interface Product {
  id: string;
  clubId: string;
  name: string;
  sku: string;
  description: string;
  category: "Jerseys" | "Hoodies" | "T-Shirts" | "Accessories";
  price: number;
  salePrice?: number;
  sizes: string[];
  stock: number;
  image?: string;
  active: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  size: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  ref: string;
  clubId: string;
  customer: string;
  email: string;
  address: string;
  items: OrderItem[];
  total: number;
  payment: "Paid — Test Mode" | "Refunded — Test Mode";
  status: "New" | "Processing" | "Shipped" | "Completed" | "Cancelled" | "Refunded";
  createdAt: number;
}

export interface Marker {
  label: string;
  x: number;
  y: number;
}

export interface Tactic {
  id: string;
  clubId: string;
  name: string;
  formation: string;
  published: boolean;
  markers: Marker[];
  sections: { title: string; body: string }[];
  images: string[];
  updatedAt: number;
}

export interface EmailLog {
  id: string;
  clubId: string;
  to: string;
  subject: string;
  status: "Demo delivery — not sent";
  createdAt: number;
}

export interface Audit {
  id: string;
  clubId: string;
  user: string;
  action: string;
  entity: string;
  meta: string;
  at: number;
}

export interface BasketItem {
  productId: string;
  size: string;
  qty: number;
}

export interface DB {
  version: number;
  clubs: Club[];
  users: User[];
  news: News[];
  events: ClubEvent[];
  players: Player[];
  staff: Staff[];
  history: Era[];
  matches: Match[];
  leagues: Record<string, LeagueRow[]>;
  trials: Trial[];
  donations: Donation[];
  products: Product[];
  orders: Order[];
  tactics: Tactic[];
  emails: EmailLog[];
  audit: Audit[];
  counters: { trial: number; order: number };
}
