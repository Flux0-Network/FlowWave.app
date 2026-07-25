import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContent, fileName } = await req.json();

    const systemPrompt = `Du bist ein erfahrener Python- und Discord-Bot-Entwickler. Du hilfst beim Schreiben, Debuggen und Verbessern von Discord-Bot-Code.

Aktuelle Datei: ${fileName ?? "unbekannt"}
${fileContent ? `\nDateiinhalt:\n\`\`\`python\n${fileContent}\n\`\`\`` : ""}

Antworte kurz und präzise. Nutze Codeblöcke für Code-Snippets. Antworte auf Deutsch wenn die Frage auf Deutsch gestellt wird.`;

    const response = await client.messages.create({
      model: "claude-sonnet-5-20251101",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
