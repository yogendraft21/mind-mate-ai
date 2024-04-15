import { checkApiLimit, increaseApiLimit } from "@/lib/apilimit";
import { checkSubscription } from "@/lib/subscription";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { createClient } from "pexels";

const client = createClient(process.env.PIXEL_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, amount, resolution } = body;
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 500 });
    }

    const freeTrial = await checkApiLimit();

    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired", { status: 403 });
    }

    const response = await client.photos.search({
      query: prompt,
      per_page: amount,
    });

    if ("photos" in response) {
      const photoURLs = response.photos.map(
        (photo: any) => photo.src[resolution]
      );
      if (!isPro) {
        increaseApiLimit();
      }
      return new NextResponse(JSON.stringify(photoURLs));
    } else {
      return new NextResponse("Image Error", { status: 500 });
    }
  } catch (error) {
    return new NextResponse("Image Error", { status: 500 });
  }
}
