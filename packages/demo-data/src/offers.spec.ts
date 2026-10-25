/**
 * Tests of the demo merchant offers: defaults from the catalogue, storage.
 */
import { beforeEach, describe, expect, it } from "vitest";

import type { DemoPartner, DemoService } from "./index";
import { defaultOffers, loadOffers, offersOf, saveOffers } from "./offers";

const service: DemoService = {
  code: "heel_repair",
  name: "Talons refaits",
  category: "shoe_repair",
  price: "15.00",
  size: "M",
  turnaround_rounds: 6,
};
const partner = {
  code: "shop",
  services: ["heel_repair", "unknown"],
} as DemoPartner;

beforeEach(() => localStorage.clear());

describe("offers", () => {
  it("start from the catalogue services of the shop", () => {
    expect(defaultOffers(partner, [service])).toEqual([
      expect.objectContaining({
        id: "shop-heel_repair",
        title: "Talons refaits",
        priceCents: 1500,
        active: true,
      }),
    ]);
  });

  it("are saved on the device and read back", () => {
    const custom = {
      ...defaultOffers(partner, [service])[0]!,
      title: "Talons cuir",
      priceCents: 1800,
    };
    expect(saveOffers({ shop: [custom] })).toBe(true);
    expect(loadOffers().shop?.[0]?.title).toBe("Talons cuir");
    expect(offersOf(partner, [service])[0]?.priceCents).toBe(1800);
  });
});
