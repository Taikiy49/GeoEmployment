import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import * as jose from 'npm:jose@5.9.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const WEBHOOK_PUBLIC_KEY = Deno.env.get("WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");

    if (!WEBHOOK_PUBLIC_KEY) {
      console.error("Missing WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY");
      return new Response("Missing public key", { status: 500 });
    }

    const body = await req.text();

    // Step 1: Verify JWT
    const publicKey = await jose.importSPKI(WEBHOOK_PUBLIC_KEY, "RS256");
    const { payload: rawPayload } = await jose.jwtVerify(body, publicKey, { algorithms: ["RS256"] });

    // Step 2: Double-parse nested JSON
    const event = JSON.parse(rawPayload.data);
    const eventData = JSON.parse(event.data);

    console.log("Webhook event type:", event.eventType);

    if (event.eventType === "wix.ecom.v1.order_approved") {
      const order = eventData.actionEvent.body.order;
      console.log("Order approved:", order.id, "| Payment:", order.paymentStatus);

      if (order.paymentStatus === "PAID") {
        const now = new Date();
        const nextBilling = new Date(now);
        nextBilling.setMonth(nextBilling.getMonth() + 1);

        // Extract subscription ID from line items
        let subscriptionId = null;
        for (const item of order.lineItems || []) {
          if (item.subscriptionInfo?.id) {
            subscriptionId = item.subscriptionInfo.id;
            break;
          }
        }

        const billingEmail = order.buyerInfo?.email || '';
        const contactDetails = order.billingInfo?.contactDetails || {};

        // Find existing subscription record or create one
        const subs = await base44.asServiceRole.entities.Subscription.list();
        const existing = subs[0];

        const subData = {
          tenantName: 'Geolabs, Inc.',
          billingEmail: billingEmail || existing?.billingEmail || '',
          planName: 'Professional',
          monthlyRate: 50,
          status: 'active',
          subscriptionStartDate: now.toISOString().split('T')[0],
          nextBillingDate: nextBilling.toISOString().split('T')[0],
          notes: subscriptionId ? `Wix Subscription ID: ${subscriptionId}` : '',
        };

        if (existing?.id) {
          await base44.asServiceRole.entities.Subscription.update(existing.id, subData);
          console.log("Subscription record updated:", existing.id);
        } else {
          await base44.asServiceRole.entities.Subscription.create(subData);
          console.log("Subscription record created");
        }
      }

    } else if (
      event.eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_canceled" ||
      event.eventType === "wix.ecom.subscription_contracts.v1.subscription_contract_expired"
    ) {
      const contract = eventData.actionEvent.body.subscriptionContract;
      const isCanceled = event.eventType.includes("canceled");
      console.log(`Subscription ${isCanceled ? 'canceled' : 'expired'}:`, contract.id);

      // Find the subscription by checking the notes field for the subscription ID
      const subs = await base44.asServiceRole.entities.Subscription.list();
      const match = subs.find(s => s.notes?.includes(contract.id));

      if (match) {
        await base44.asServiceRole.entities.Subscription.update(match.id, {
          status: isCanceled ? 'cancelled' : 'cancelled',
        });
        console.log("Subscription marked cancelled:", match.id);
      } else if (subs[0]) {
        // Fallback: update the only subscription record
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, {
          status: 'cancelled',
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response("Error", { status: 500 });
  }
});