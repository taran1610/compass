import Stripe from "stripe";

export const stripe =
  process.env.STRIPE_SECRET_KEY ?
    new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const PLANS = {
  starter: {
    priceId: process.env.STRIPE_PRICE_ID_STARTER ?? "",
    name: "Starter",
    price: 29,
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_ID_PRO ?? "",
    name: "Pro",
    price: 79,
  },
} as const;
