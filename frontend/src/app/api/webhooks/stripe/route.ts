import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  // Forward Stripe webhooks to the FastAPI backend
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  const response = await fetch(`${API_URL}/api/v1/webhooks/stripe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
