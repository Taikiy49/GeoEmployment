import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const WIX_API_KEY = Deno.env.get("WIX_PAYMENTS_API_KEY");
    const WIX_SITE_ID = Deno.env.get("WIX_PAYMENTS_SITE_ID");

    const origin = req.headers.get("Origin") || "https://app.base44.com";

    const response = await fetch(
      "https://www.wixapis.com/payments/platform/v1/checkout-sessions/construct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": WIX_API_KEY,
          "wix-site-id": WIX_SITE_ID,
        },
        body: JSON.stringify({
          cart: {
            items: [
              {
                name: "Geolabs ATS — Professional Plan",
                quantity: 1,
                price: "25.00",
                subscriptionInfo: {
                  subscriptionSettings: {
                    frequency: "MONTH",
                  },
                  title: "Geolabs ATS Monthly Subscription",
                  description: "Full access to the Geolabs HR Applicant Tracking System, billed monthly.",
                },
              },
            ],
          },
          callbackUrls: {
            postFlowUrl: `${origin}/admin/billing`,
            thankYouPageUrl: `${origin}/admin/billing?payment=success`,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Wix checkout error:", JSON.stringify(data));
      return Response.json({ error: data.message || "Failed to create checkout" }, { status: 500 });
    }

    return Response.json({ redirectUrl: data.checkoutSession.redirectUrl });
  } catch (error) {
    console.error("createCheckout error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});