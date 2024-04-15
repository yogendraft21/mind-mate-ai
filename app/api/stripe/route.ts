import prismadb from '@/lib/prismadb';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { absoluteUrl } from '@/lib/utils';

const settingUrl = absoluteUrl("/settings");

export async function GET() {
    try {
        const { userId } = auth();
        const user = await currentUser();

        if (!userId || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userSubscription = await prismadb.userSubscription.findUnique({
            where: {
                userId
            }
        });

        if (userSubscription && userSubscription.stripeCustomerId) {
            const stripeSesion = await stripe.billingPortal.sessions.create({
                customer: userSubscription.stripeCustomerId,
                return_url: settingUrl
            });

            return new NextResponse(JSON.stringify({ url: stripeSesion.url }));
        }

        const stripeSession = await stripe.checkout.sessions.create({
          success_url: settingUrl,
          cancel_url: settingUrl,
          payment_method_types: ["card"],
          mode: "subscription",
          billing_address_collection: "required",
          customer_email: user.emailAddresses[0].emailAddress,
          line_items: [
            {
              price_data: {
                currency: "INR",
                product_data: {
                  name: "MindMate Pro",
                  description: "Unlimited AI Generation",
                },
                unit_amount: 199900,
                recurring: {
                  interval: "month",
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId,
          },
        });

        return new NextResponse(JSON.stringify({ url: stripeSession.url }));
    } catch (error) {
        console.log("[Stripe_Error]", error);
        return new NextResponse("error", { status: 500 });
    }
}