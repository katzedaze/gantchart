import { NextRequest, NextResponse } from "next/server";
import translate from "google-translate-api-x";

export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json();

    if (!text || !to) {
      return NextResponse.json(
        { error: "Missing required fields: text, to" },
        { status: 400 }
      );
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ translatedText: "" });
    }

    // Limit text length to prevent abuse
    const trimmed = text.slice(0, 5000);

    const result = await translate(trimmed, {
      from: from || "en",
      to,
    });

    return NextResponse.json({
      translatedText: result.text,
      from: result.from.language.iso,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
