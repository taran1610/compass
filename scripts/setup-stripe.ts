/**
 * Creates Compass pricing products and prices in Stripe.
 * Run: STRIPE_SECRET_KEY=sk_test_... npx tsx scripts/setup-stripe.ts
 *
 * Outputs the price IDs to add to .env.local
 */

import Stripe from "stripe";

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error("Set STRIPE_SECRET_KEY to run this script");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY);

const PLANS = [
  {
    name: "Starter",
    description: "For individual product managers",
    price: 29,
    interval: "month" as const,
    features: [
      "1 workspace",
      "500 signal uploads/mo",
      "AI Insights Dashboard",
      "5 PRDs/month",
      "Email support",
    ],
  },
  {
    name: "Pro",
    description: "For product teams",
    price: 79,
    interval: "month" as const,
    features: [
      "Unlimited workspaces",
      "Unlimited signal uploads",
      "Opportunity Detection",
      "Roadmap Builder",
      "Unlimited PRDs",
      "Priority support",
      "Team collaboration",
    ],
  },
];

async function main() {
  console.log("Creating Stripe products and prices for Compass...\n");

  const priceIds: Record<string, string> = {};

  for (const plan of PLANS) {
    const product = await stripe.products.create({
      name: `Compass ${plan.name}`,
      description: plan.description,
      metadata: { plan: plan.name.toLowerCase() },
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price * 100,
      currency: "usd",
      recurring: { interval: plan.interval },
      metadata: { plan: plan.name.toLowerCase() },
    });
    console.log(`Created price: $${plan.price}/mo (${price.id})\n`);

    priceIds[plan.name.toLowerCase()] = price.id;
  }

  console.log("--- Add these to .env.local ---\n");
  console.log(`STRIPE_PRICE_ID_STARTER=${priceIds.starter}`);
  console.log(`STRIPE_PRICE_ID_PRO=${priceIds.pro}`);
  console.log(`\n# For the pricing page (client-side validation)`);
  console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER=${priceIds.starter}`);
  console.log(`NEXT_PUBLIC_STRIPE_PRICE_ID_PRO=${priceIds.pro}`);
  console.log("\n--- End ---");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
