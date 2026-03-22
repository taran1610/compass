import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const stripe = await import("stripe").then((m) =>
    process.env.STRIPE_SECRET_KEY
      ? new m.default(process.env.STRIPE_SECRET_KEY)
      : null
  );

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[stripe/webhook] Supabase not configured");
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.warn("[stripe/webhook] No user_id in checkout.session.completed");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription & { current_period_end?: number };
        const priceId = sub.items.data[0]?.price.id;
        const plan = session.metadata?.plan ?? (priceId?.includes("pro") ? "pro" : "starter");
        const periodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : 0;

        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            plan,
            status: sub.status,
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription & { current_period_end?: number };
        const userId = sub.metadata?.user_id;
        const periodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : 0;

        if (!userId) {
          const existing = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", sub.id)
            .single();
          if (existing.data?.user_id) {
            await supabase
              .from("subscriptions")
              .update({
                status: sub.status,
                current_period_end: new Date(periodEnd * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("stripe_subscription_id", sub.id);
          }
          break;
        }

        await supabase
          .from("subscriptions")
          .update({
            status: sub.status,
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
        break;
      }

      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Processing error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
