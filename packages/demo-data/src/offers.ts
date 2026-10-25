/**
 * @file Merchant offers of the demo: what a partner shop sells through
 * CityPal (title, description, photo, price, locker size, turnaround).
 *
 * DEMO: offers start from the catalogue and are edited in the partner portal;
 * they are stored on the device (`localStorage`) under one key shared by the
 * customer app and the portal, which are served from the same site, so an
 * offer created in the portal shows in the customer app on the same device.
 * PROD: offers are stored by the API, photos in object storage.
 */
import type { DemoPartner, DemoService } from "./index";

/** One offer of a partner shop. */
export interface Offer {
  id: string;
  /** Service type, for the customer's search (a catalogue service code). */
  service: string;
  title: string;
  description: string;
  priceCents: number;
  /** Compartment size the item needs: S, M, L or XL. */
  size: string;
  /** Rounds between collection and return (3 rounds = 1 day). */
  turnaroundRounds: number;
  /** Downscaled JPEG as a data URL, or null. */
  photo: string | null;
  active: boolean;
}

/** Offers by shop code. */
export type OffersByShop = Record<string, Offer[]>;

export const OFFERS_STORAGE_KEY = "citypal-merchant-offers-v1";

/** Starting offers of a shop: the catalogue services of its category. */
export function defaultOffers(
  partner: DemoPartner,
  services: DemoService[],
): Offer[] {
  return partner.services.flatMap((code) => {
    const service = services.find((s) => s.code === code);
    if (!service) return [];
    return [
      {
        id: `${partner.code}-${code}`,
        service: code,
        title: service.name,
        description: "",
        priceCents: Math.round(Number.parseFloat(service.price) * 100),
        size: service.size,
        turnaroundRounds: service.turnaround_rounds,
        photo: null,
        active: true,
      },
    ];
  });
}

/** Offers saved on this device (empty when none or when storage is unavailable). */
export function loadOffers(): OffersByShop {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OffersByShop) : {};
  } catch {
    return {};
  }
}

/** Saves the offers; returns false when the device storage is full or unavailable. */
export function saveOffers(offers: OffersByShop): boolean {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
    return true;
  } catch {
    return false;
  }
}

/** Offers of a shop: saved ones if any, otherwise the starting offers. */
export function offersOf(
  partner: DemoPartner,
  services: DemoService[],
  saved: OffersByShop = loadOffers(),
): Offer[] {
  return saved[partner.code] ?? defaultOffers(partner, services);
}
