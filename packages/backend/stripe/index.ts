import { secrets } from "../../config/index.js";
import type { PremiumStripeSession } from "../../types/index.js";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/db/db.js";
import { tables } from "../src/db/index.js";
import stripe from "./stripe.js";

const { PRICES } = secrets.STRIPE;

export async function getPortalSessions(id: string, getUrls: boolean = true) {
    const entries = await db.select({ customerId: tables.customers.stripe }).from(tables.customers).where(eq(tables.customers.discord, id));
    const customers = await Promise.all(entries.map(({ customerId }) => stripe.customers.retrieve(customerId, { expand: ["subscriptions"] })));

    const output: PremiumStripeSession[] = [];

    for (const customer of customers) {
        if (customer.deleted) continue;

        output.push({
            subscriptions: (customer.subscriptions?.data ?? []).flatMap((sub) =>
                sub.items.data.map((item) => ({
                    created: sub.created,
                    product:
                        {
                            [PRICES.PREMIUM_MONTHLY]: "Premium (Monthly)",
                            [PRICES.PREMIUM_YEARLY]: "Premium (Yearly)",
                            [PRICES.CUSTOM_MONTHLY]: "Custom Client (Monthly)",
                            [PRICES.CUSTOM_YEARLY]: "Custom Client (Yearly)",
                        }[item.price.id] ?? "Unknown Product",
                    quantity: item.quantity ?? 1,
                    type: item.price.id === PRICES.PREMIUM_MONTHLY || item.price.id === PRICES.PREMIUM_YEARLY ? "premium" : "custom",
                })),
            ),
            url: getUrls
                ? await (async () => {
                      const configuration = await stripe.billingPortal.configurations.create({
                          business_profile: {
                              terms_of_service_url: `${secrets.DOMAIN}/terms`,
                              privacy_policy_url: `${secrets.DOMAIN}/privacy`,
                          },
                          features: {
                              payment_method_update: {
                                  enabled: true,
                              },
                              subscription_update: {
                                  enabled: true,
                                  default_allowed_updates: ["price", "quantity"],
                                  products: [
                                      { product: secrets.STRIPE.PRODUCTS.PREMIUM, prices: [PRICES.PREMIUM_MONTHLY, PRICES.PREMIUM_YEARLY] },
                                      { product: secrets.STRIPE.PRODUCTS.CUSTOM, prices: [PRICES.CUSTOM_MONTHLY, PRICES.CUSTOM_YEARLY] },
                                  ],
                              },
                              subscription_cancel: {
                                  enabled: true,
                                  cancellation_reason: {
                                      enabled: true,
                                      options: [
                                          "switched_service",
                                          "too_complex",
                                          "too_expensive",
                                          "customer_service",
                                          "low_quality",
                                          "missing_features",
                                          "unused",
                                          "other",
                                      ],
                                  },
                              },
                          },
                      });

                      return (
                          await stripe.billingPortal.sessions.create({
                              customer: customer.id,
                              return_url: `${secrets.DOMAIN}/account/premium`,
                              configuration: configuration.id,
                          })
                      ).url;
                  })()
                : "",
        });
    }

    return output;
}

export async function getPaymentLinks(id: string) {
    const key = `${id}/${JSON.stringify(PRICES)}`;

    const [entry] = await db.select({ links: tables.paymentLinks.links }).from(tables.paymentLinks).where(eq(tables.paymentLinks.key, key));
    if (entry) return JSON.parse(entry.links) as [string, string, string, string];

    const links = (await Promise.all(
        [PRICES.PREMIUM_MONTHLY, PRICES.PREMIUM_YEARLY, PRICES.CUSTOM_MONTHLY, PRICES.CUSTOM_YEARLY].map(
            async (price) =>
                (
                    await stripe.paymentLinks.create({
                        line_items: [{ price, quantity: 1, adjustable_quantity: { enabled: true, minimum: 1, maximum: 100 } }],
                        metadata: { id },
                        after_completion: { type: "redirect", redirect: { url: `${secrets.DOMAIN}/stripe-callback` } },
                    })
                ).url,
        ),
    )) as [string, string, string, string];

    await db
        .insert(tables.paymentLinks)
        .values({ key, links: JSON.stringify(links) })
        .onDuplicateKeyUpdate({ set: { key: sql`'key'` } });

    return links;
}
