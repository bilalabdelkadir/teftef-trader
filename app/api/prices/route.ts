import { NextRequest, NextResponse } from "next/server";
import { getPrice, getPrices } from "@/lib/market-data";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbols = searchParams.get("symbols");

    if (!symbols) {
      return NextResponse.json(
        { error: "Symbols parameter is required" },
        { status: 400 }
      );
    }

    const symbolList = symbols.split(",").map((s) => s.trim());

    if (symbolList.length === 1) {
      const priceData = await getPrice(symbolList[0]);
      return NextResponse.json({ [symbolList[0]]: priceData });
    }

    const prices = await getPrices(symbolList);
    return NextResponse.json(prices);
  } catch (error) {
    console.error("Price fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
