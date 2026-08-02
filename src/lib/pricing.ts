import { CATALOG } from "./catalog";
import type { DealSpec, LineItem, Quote, QuoteYear } from "./deal-schema";

const mulBps = (amount: number, bps: number) => Math.round((amount * bps) / 10_000);

function quantityForYear(values: DealSpec["seats"], year: number) {
  const exact = values.find((value) => value.year === year);
  if (exact) return exact.quantity;
  const prior = values.filter((value) => value.year < year).at(-1);
  return prior?.quantity ?? values[0]?.quantity ?? 0;
}

export function annualSeatListCents(seats: number) {
  let remaining = seats;
  let lowerBound = 0;
  let monthlyCents = 0;

  for (const tier of CATALOG.seatTiers) {
    const capacity = tier.upTo - lowerBound;
    const inTier = Math.min(remaining, capacity);
    monthlyCents += inTier * tier.monthlyUnitCents;
    remaining -= inTier;
    if (remaining <= 0) break;
    lowerBound = tier.upTo;
  }

  return monthlyCents * 12;
}

function item(
  key: string,
  label: string,
  quantity: number,
  unit: string,
  listCents: number,
  cogsBps: number,
  discountBps: number,
): LineItem {
  const discountCents = mulBps(listCents, discountBps);
  const netCents = listCents - discountCents;
  return {
    key,
    label,
    quantity,
    unit,
    listCents,
    discountCents,
    netCents,
    costCents: mulBps(listCents, cogsBps),
  };
}

function quoteYear(deal: DealSpec, year: number): QuoteYear {
  const seats = quantityForYear(deal.seats, year);
  const credits = quantityForYear(deal.computeCredits, year);
  const preSupport: Array<Omit<LineItem, "discountCents" | "netCents" | "costCents"> & { cogsBps: number }> = [
    {
      key: "platform",
      label: "Atlas platform",
      quantity: 1,
      unit: "workspace",
      listCents: CATALOG.platformAnnualCents,
      cogsBps: CATALOG.cogsBps.platform,
    },
    {
      key: "seats",
      label: "Builder seats",
      quantity: seats,
      unit: "seats",
      listCents: annualSeatListCents(seats),
      cogsBps: CATALOG.cogsBps.seats,
    },
    {
      key: "compute",
      label: "Compute credits",
      quantity: credits,
      unit: "credits",
      listCents: credits * CATALOG.computeCreditCents,
      cogsBps: CATALOG.cogsBps.compute,
    },
  ];

  if (deal.regions.includes("EU")) {
    preSupport.push({
      key: "eu",
      label: "EU data residency",
      quantity: 1,
      unit: "region",
      listCents: CATALOG.euResidencyAnnualCents,
      cogsBps: CATALOG.cogsBps.eu,
    });
  }

  if (deal.deployment === "PRIVATE_CLOUD") {
    preSupport.push({
      key: "private-cloud",
      label: "Private cloud",
      quantity: 1,
      unit: "environment",
      listCents: CATALOG.privateCloudAnnualCents,
      cogsBps: CATALOG.cogsBps.privateCloud,
    });
  }

  const lineItems = preSupport.map((value) =>
    item(value.key, value.label, value.quantity, value.unit, value.listCents, value.cogsBps, deal.discountBps),
  );

  if (deal.support === "PREMIUM") {
    const supportListCents = mulBps(
      preSupport.reduce((sum, value) => sum + value.listCents, 0),
      CATALOG.premiumSupportBps,
    );
    lineItems.push(
      item(
        "support",
        "Premium support",
        1,
        "plan",
        supportListCents,
        CATALOG.cogsBps.support,
        deal.discountBps,
      ),
    );
  }

  const listCents = lineItems.reduce((sum, value) => sum + value.listCents, 0);
  const discountCents = lineItems.reduce((sum, value) => sum + value.discountCents, 0);
  const netCents = lineItems.reduce((sum, value) => sum + value.netCents, 0);
  const costCents = lineItems.reduce((sum, value) => sum + value.costCents, 0);

  return {
    year,
    lineItems,
    listCents,
    discountCents,
    netCents,
    costCents,
    marginBps: netCents === 0 ? 0 : Math.round(((netCents - costCents) * 10_000) / netCents),
  };
}

export function priceDeal(deal: DealSpec): Quote {
  const yearCount = Math.ceil(deal.termMonths / 12);
  const years = Array.from({ length: yearCount }, (_, index) => quoteYear(deal, index + 1));
  const listTcvCents = years.reduce((sum, year) => sum + year.listCents, 0);
  const netTcvCents = years.reduce((sum, year) => sum + year.netCents, 0);
  const costTcvCents = years.reduce((sum, year) => sum + year.costCents, 0);

  return {
    years,
    listTcvCents,
    netTcvCents,
    costTcvCents,
    marginBps:
      netTcvCents === 0 ? 0 : Math.round(((netTcvCents - costTcvCents) * 10_000) / netTcvCents),
  };
}
