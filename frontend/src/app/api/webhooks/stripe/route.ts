import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  // Forward LemonSqueezy webhooks to the FastAPI backend
  const body = await request.text();
  const signature = request.headers.get("x-signature") || "";

  const response = await fetch(`${API_URL}/api/v1/webhooks/lemonsqueezy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-signature": signature,
    },
    body,
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
