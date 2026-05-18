import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `당신은 사용자가 어떤 한 장면(scene)을 머릿속에 구체화하도록 돕는 상상 파트너입니다.
사용자가 언급하는 분위기, 인물, 장소, 소품, 감정 등을 자연스럽게 이끌어내고,
모호한 부분이 있으면 한 번에 한두 가지씩 질문합니다.
대화는 한국어 존댓말로 정중하고 간결하게 진행합니다.`;

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요." },
      { status: 500 },
    );
  }

  const body = (await req.json()) as { messages: ClientMessage[] };
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages가 비어있습니다." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const reply = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return NextResponse.json({ reply });
}
