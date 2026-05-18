import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI, Modality } from "@google/genai";
import { NextResponse } from "next/server";

type ClientMessage = { role: "user" | "assistant"; content: string };

const PROMPT_BUILDER_SYSTEM = `You convert a Korean conversation into a single English image-generation prompt.
Output ONLY the prompt text — no explanations, no quotes, no preamble.
The prompt must:
- describe a single coherent scene (subject, setting, mood, lighting, composition, style)
- be vivid and concrete, ~60-120 words
- prefer cinematic, photorealistic style unless the conversation suggests otherwise
- never include people's real names or copyrighted characters`;

export async function POST(req: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!anthropicKey || !geminiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY와 GEMINI_API_KEY가 모두 필요합니다. .env.local 파일을 확인하세요." },
      { status: 500 },
    );
  }

  const body = (await req.json()) as { messages: ClientMessage[] };
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "대화 내용이 비어있습니다." }, { status: 400 });
  }

  const transcript = body.messages
    .map((m) => `${m.role === "user" ? "USER" : "ASSISTANT"}: ${m.content}`)
    .join("\n");

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const summary = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: PROMPT_BUILDER_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Conversation transcript:\n\n${transcript}\n\nWrite the image prompt now.`,
      },
    ],
  });

  const prompt = summary.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!prompt) {
    return NextResponse.json({ error: "프롬프트 생성에 실패했습니다." }, { status: 500 });
  }

  const genai = new GoogleGenAI({ apiKey: geminiKey });
  const result = await genai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const parts = result.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData?.data);
  const imageBase64 = imagePart?.inlineData?.data;

  if (!imageBase64) {
    const textPart = parts.find((p) => p.text)?.text;
    return NextResponse.json(
      {
        error:
          "이미지가 반환되지 않았습니다. (안전 필터 또는 모델 미응답) " +
          (textPart ? `모델 응답: ${textPart}` : ""),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ imageBase64, prompt });
}
