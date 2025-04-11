import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    console.log("Attempting to fetch calendar from:", url);

    const response = await fetch(url, {
      headers: {
        Accept: "text/calendar, application/calendar, text/plain",
        "User-Agent": "Calendar-App/1.0",
      },
      cache: "no-store",
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      return NextResponse.json(
        {
          error: `Failed to fetch calendar: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.text();
    console.log("Received data length:", data.length);
    console.log("First 100 characters:", data.substring(0, 100));

    if (!data || data.trim().length === 0) {
      return NextResponse.json(
        { error: "Received empty response from calendar feed" },
        { status: 500 }
      );
    }

    // Verify that the response looks like an iCal feed
    if (!data.includes("BEGIN:VCALENDAR")) {
      console.error("Invalid iCal format. Received data:", data);
      return NextResponse.json(
        { error: "Invalid calendar format received" },
        { status: 500 }
      );
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": "text/calendar",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error proxying calendar request:", error);
    return NextResponse.json(
      {
        error: "Failed to proxy calendar request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
