import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    // Get subscription ID from our DB record (stored in notes field)
    const subs = await base44.asServiceRole.entities.Subscription.list();
    const sub = subs[0];

    if (!sub) {
      return Response.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Extract Wix subscription ID from notes field
    const match = sub.notes?.match(/Wix Subscription ID: ([a-f0-9-]+)/);
    if (!match) {
      return Response.json({ error: 'No Wix subscription ID found. Cannot cancel via API.' }, { status: 400 });
    }

    const subscriptionId = match[1];
    console.log("Cancelling Wix subscription:", subscriptionId);

    // Try soft cancel first (keeps active until end of billing cycle)
    let response = await fetch(
      `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({
          subscription_id: subscriptionId,
          reason: "Cancelled by account owner via billing portal",
          immediate: false,
        }),
      }
    );

    // If soft cancel fails (auto-renew already off, etc.), force immediate cancel
    if (!response.ok) {
      console.log("Soft cancel failed, trying immediate cancel...");
      response = await fetch(
        `https://www.wixapis.com/payments/base44/v1/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": WIX_API_KEY,
            "wix-site-id": WIX_SITE_ID,
          },
          body: JSON.stringify({
            subscription_id: subscriptionId,
            reason: "Cancelled by account owner via billing portal",
            immediate: true,
          }),
        }
      );
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("Wix cancel error:", JSON.stringify(data));
      return Response.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    console.log("Wix cancel response:", JSON.stringify(data));

    // Update our DB record status
    await base44.asServiceRole.entities.Subscription.update(sub.id, { status: 'cancelled' });

    return Response.json({ success: true, status: data.subscription?.status });
  } catch (error) {
    console.error("cancelSubscription error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});