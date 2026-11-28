import { apiRequest } from "./authApi";

/**
 * Pricing for the public page.
 *
 * The page used to carry its own copy of every figure, in pounds, for every
 * visitor. These come from the rows checkout actually bills from, for the
 * country being viewed, so what is advertised and what is charged are one
 * number.
 */

export type PublicPricingPlan = {
  planCode: string | null;
  name: string;
  description: string | null;
  currency: string;
  monthlyPriceMinor: number;
  commissionPercentage: number | null;
  features: string[];
  taxInclusive: boolean;
};

export type PublicPricing = {
  country: string;
  commission: { starterPercentage: number; proPercentage: number };
  patients: PublicPricingPlan[];
  professionals: PublicPricingPlan[];
  organizations: PublicPricingPlan[];
};

export function getPublicPricing(country?: string) {
  const query = country ? `?country=${encodeURIComponent(country)}` : "";
  return apiRequest<PublicPricing>(`/public/pricing${query}`, {
    method: "GET",
  });
}
