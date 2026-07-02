import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { systemPrompt, userContent, apiKey, model } =
      body as Record<string, unknown>;

    if (typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 401 }
      );
    }

    if (
      typeof systemPrompt !== "string" ||
      !systemPrompt.trim() ||
      typeof userContent !== "string" ||
      !userContent.trim()
    ) {
      return NextResponse.json(
        { error: "systemPrompt and userContent are required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey.trim(),
    });

    const completion = await openai.chat.completions.create({
      model: typeof model === "string" && model.trim() ? model : "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
