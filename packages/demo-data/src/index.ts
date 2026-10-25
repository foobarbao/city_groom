/**
 * @file Typed access to the demo dataset (see README.md).
 *
 * Public and operator data are snapshots of the real API, typed with the
 * generated API types. Activity data is fictitious and typed here, mirroring
 * the output of `apps.demo.activity` in the backend.
 */
import type {
  LockerFeatureCollection,
  LockerLayout,
  MerchantFeatureCollection,
  OperatorLockerLayout,
  SizeSpec,
  components,
} from "@city-groom/api-client";

import activityJson from "../data/activity.json";
import catalogueJson from "../data/catalogue.json";
import operatorJson from "../data/operator.json";
import publicJson from "../data/public.json";

/** Snapshot of the public API. */
export interface PublicData {
  lockers: LockerFeatureCollection;
  details: Record<string, LockerLayout>;
  sizes: SizeSpec[];
  merchants: MerchantFeatureCollection;
}

/** Snapshot of the operator API. */
export interface OperatorData {
  lockers: components["schemas"]["OperatorLockerFeatureList"];
  details: Record<string, OperatorLockerLayout>;
  stats: components["schemas"]["NetworkStats"];
}

/** Status of a fictitious order at the reference time. */
export type OrderStatus =
  | "awaiting_drop_off"
  | "in_locker"
  | "at_merchant"
  | "ready_for_pickup"
  | "picked_up";

/** A fictitious order. Amounts are decimal strings in euros; dates are ISO 8601. */
export interface DemoOrder {
  id: string;
  merchant: string;
  service: string;
  items: number;
  size: string;
  price_total: string;
  commission: string;
  drop_locker: string;
  pickup_locker: string;
  created_at: string;
  deposited_at: string;
  collected_at: string | null;
  returned_at: string | null;
  picked_up_at: string | null;
  late_pickup: boolean;
  status: OrderStatus;
}

/** A fictitious courier round. */
export interface DemoRound {
  id: string;
  starts_at: string;
  status: "done" | "planned";
  items_collected: number;
  items_returned: number;
  /** Consigne transfers made at this round. */
  transfers: number;
  locker_stops: string[];
  merchant_stops: string[];
  distance_km: number;
}

/** A fictitious consigne transfer: stored items moved between lockers at a round. */
export interface DemoTransfer {
  id: string;
  round_at: string;
  from_locker: string;
  to_locker: string;
  size: string;
}

/** Fictitious activity of the network. */
export interface ActivityData {
  fictitious: true;
  generated_at: string;
  timezone: string;
  round_times: string[];
  commission_rate: string;
  merchants: {
    code: string;
    name: string;
    category: string;
    latitude: number;
    longitude: number;
  }[];
  services: {
    code: string;
    name: string;
    category: string;
    price: string;
    size: string;
  }[];
  orders: DemoOrder[];
  transfers: DemoTransfer[];
  rounds: DemoRound[];
  daily: {
    date: string;
    orders: number;
    items: number;
    revenue: string;
    commission: string;
  }[];
  forecast: { date: string; orders: number; items: number }[];
}

/** A fictitious review of a partner shop (ADR-0008). */
export interface DemoReview {
  author: string;
  rating: number;
  comment: string;
  /** ISO date. */
  date: string;
  verified_order: boolean;
}

/** A fictitious partner shop ("Démo · …") with its services and reviews. */
export interface DemoPartner {
  code: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  /** Service codes, see `CatalogueData.services`. */
  services: string[];
  reviews: {
    average: number;
    count: number;
    /** Number of ratings per star, keys "5" to "1". */
    distribution: Record<string, number>;
    recent: DemoReview[];
  };
}

/** A standard service sold at a fixed price per item (placeholder prices). */
export interface DemoService {
  code: string;
  name: string;
  category: string;
  price: string;
  size: string;
  /** Rounds between collection and return (3 rounds = 1 day). */
  turnaround_rounds: number;
}

/** A customer subscription plan (placeholder, docs/PRODUCT.md open question 8). */
export interface SubscriptionPlan {
  code: string;
  name: string;
  monthly_price: string;
  /** Share taken off consigne prices and transfer supplements, "0" to "1". */
  consigne_discount: string;
  /** Consigne transfers included per month. */
  transfers_included: number;
  perks: string[];
}

/** A slot between two rounds (docs/PRODUCT.md §4). */
export interface Slot {
  code: "morning" | "afternoon" | "evening";
  label: string;
  /** "HH:MM", local time in Grenoble. */
  starts: string;
  ends: string;
}

/** Customer catalogue of the demo (fictitious partners, placeholder plans, rules). */
export interface CatalogueData {
  fictitious: true;
  partners: DemoPartner[];
  services: DemoService[];
  plans: SubscriptionPlan[];
  consigne: {
    max_hours: number;
    min_notice_hours: number;
    /** Price per booking without subscription, by compartment size. */
    prices: Record<string, string>;
    /** Supplement to move stored items to another locker, without subscription. */
    transfer_price: string;
  };
  round_times: string[];
  slots: Slot[];
}

export const publicData = publicJson as unknown as PublicData;
export const catalogueData = catalogueJson as unknown as CatalogueData;
export const operatorData = operatorJson as unknown as OperatorData;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Offset of a time zone from UTC at an instant, in milliseconds. */
function offsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value);
  const local = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return local - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Moves an instant by whole days, keeping its local time of day in
 * `timeZone` across daylight-saving changes (20:00 stays 20:00).
 */
function shiftIso(value: string, days: number, timeZone: string): string;
function shiftIso(
  value: string | null,
  days: number,
  timeZone: string,
): string | null;
function shiftIso(
  value: string | null,
  days: number,
  timeZone: string,
): string | null {
  if (value === null) return null;
  const original = new Date(value);
  const shifted = new Date(original.getTime() + days * DAY_MS);
  const correction = offsetMs(original, timeZone) - offsetMs(shifted, timeZone);
  return new Date(shifted.getTime() + correction).toISOString();
}

function shiftDate(value: string, days: number): string {
  return new Date(new Date(`${value}T12:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Returns the activity with every date moved by whole days so that its
 * reference day becomes `today`, keeping local times of day in the activity's
 * time zone, also across a daylight-saving change (rounds stay at 07:00,
 * 14:00 and 20:00).
 *
 * @param activity - Activity as generated.
 * @param today - Day the demo should look like (default: now).
 */
export function rebaseActivity(
  activity: ActivityData,
  today: Date = new Date(),
): ActivityData {
  const generated = new Date(activity.generated_at);
  const days = Math.round(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(
        generated.getFullYear(),
        generated.getMonth(),
        generated.getDate(),
      )) /
      DAY_MS,
  );
  if (days === 0) return activity;
  const tz = activity.timezone ?? "Europe/Paris";
  return {
    ...activity,
    generated_at: shiftIso(activity.generated_at, days, tz),
    orders: activity.orders.map((o) => ({
      ...o,
      created_at: shiftIso(o.created_at, days, tz),
      deposited_at: shiftIso(o.deposited_at, days, tz),
      collected_at: shiftIso(o.collected_at, days, tz),
      returned_at: shiftIso(o.returned_at, days, tz),
      picked_up_at: shiftIso(o.picked_up_at, days, tz),
    })),
    transfers: activity.transfers.map((t) => ({
      ...t,
      round_at: shiftIso(t.round_at, days, tz),
    })),
    rounds: activity.rounds.map((r) => ({
      ...r,
      starts_at: shiftIso(r.starts_at, days, tz),
    })),
    daily: activity.daily.map((d) => ({ ...d, date: shiftDate(d.date, days) })),
    forecast: activity.forecast.map((f) => ({
      ...f,
      date: shiftDate(f.date, days),
    })),
  };
}

/** Fictitious activity, rebased to today. */
export const activityData: ActivityData = rebaseActivity(
  activityJson as unknown as ActivityData,
);
