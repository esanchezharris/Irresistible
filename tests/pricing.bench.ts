import { bench, describe } from "vitest";
import { priceDeal } from "../src/lib/pricing";
import { routeApprovals } from "../src/lib/approvals";
import { findAlternatives } from "../src/lib/alternatives";
import { sampleDeal } from "./fixture";

describe("transaction engine", () => {
  bench("price + route", () => {
    const quote = priceDeal(sampleDeal);
    routeApprovals(sampleDeal, quote);
  });

  bench("bounded counterfactual search", () => {
    findAlternatives(sampleDeal);
  });
});
