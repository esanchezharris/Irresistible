export const CATALOG = {
  platformAnnualCents: 6_000_000,
  computeCreditCents: 80,
  euResidencyAnnualCents: 7_500_000,
  privateCloudAnnualCents: 12_000_000,
  premiumSupportBps: 1_500,
  cogsBps: {
    platform: 1_000,
    seats: 1_800,
    compute: 3_500,
    eu: 1_500,
    privateCloud: 2_200,
    support: 3_000,
  },
  seatTiers: [
    { upTo: 100, monthlyUnitCents: 15_000 },
    { upTo: 500, monthlyUnitCents: 12_000 },
    { upTo: Number.POSITIVE_INFINITY, monthlyUnitCents: 9_500 },
  ],
} as const;

export const POLICY = {
  managerDiscountBps: 1_000,
  vpDiscountBps: 2_000,
  financeMarginBps: 6_500,
  cfoTcvCents: 200_000_000,
} as const;
