"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isChatting) return;

    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setIsChatting(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { reply: string } = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "대화에 실패했습니다.");
    } finally {
      setIsChatting(false);
    }
  }

  async function generateImage() {
    if (messages.length === 0 || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setImageUrl(null);
    setImagePrompt(null);

    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { imageBase64: string; prompt: string } = await res.json();
      setImageUrl(`data:image/png;base64,${data.imageBase64}`);
      setImagePrompt(data.prompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 생성에 실패했습니다.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Vibe Code Sample</h1>
        <p style={styles.subtitle}>
          Claude와 대화하고, 대화를 한 장면의 이미지로 생성합니다 (Gemini 2.5 Flash Image)
        </p>
      </header>

      <section style={styles.chat}>
        <div style={styles.messages}>
          {messages.length === 0 && (
            <p style={styles.placeholder}>
              아래에 메시지를 입력하여 대화를 시작하세요.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                ...styles.bubble,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#2b6cb0" : "#1f2937",
              }}
            >
              <div style={styles.role}>{m.role === "user" ? "사용자" : "Claude"}</div>
              <div>{m.content}</div>
            </div>
          ))}
          {isChatting && <div style={styles.loading}>Claude가 답변 중…</div>}
        </div>

        <div style={styles.inputRow}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="메시지를 입력하세요 (Shift+Enter 줄바꿈)"
            style={styles.textarea}
            rows={2}
          />
          <button onClick={sendMessage} disabled={isChatting || !input.trim()} style={styles.sendBtn}>
            보내기
          </button>
        </div>

        <button
          onClick={generateImage}
          disabled={isGenerating || messages.length === 0}
          style={styles.imageBtn}
        >
          {isGenerating ? "이미지 생성 중… (10~30초)" : "이 대화를 이미지로 만들기"}
        </button>

        {error && <div style={styles.error}>오류: {error}</div>}
      </section>

      {(imageUrl || imagePrompt) && (
        <section style={styles.imagePanel}>
          {imagePrompt && (
            <details style={styles.promptBox}>
              <summary>이미지 생성에 사용된 프롬프트 보기</summary>
              <pre style={styles.promptPre}>{imagePrompt}</pre>
            </details>
          )}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="generated" style={styles.image} />
          )}
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "32px 20px 64px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  header: { textAlign: "center" },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
  subtitle: { color: "#9aa0a6", fontSize: 14 },
  chat: { display: "flex", flexDirection: "column", gap: 12 },
  messages: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 200,
    padding: 16,
    background: "#161a22",
    borderRadius: 12,
    border: "1px solid #232936",
  },
  placeholder: { color: "#6b7280", textAlign: "center", padding: "60px 0" },
  bubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    borderRadius: 12,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  role: { fontSize: 11, opacity: 0.7, marginBottom: 4 },
  loading: { color: "#9aa0a6", fontSize: 13, alignSelf: "flex-start" },
  inputRow: { display: "flex", gap: 8 },
  textarea: {
    flex: 1,
    padding: 12,
    background: "#161a22",
    color: "#e8eaed",
    border: "1px solid #232936",
    borderRadius: 8,
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 14,
  },
  sendBtn: {
    padding: "0 18px",
    background: "#2b6cb0",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
  },
  imageBtn: {
    padding: "14px 18px",
    background: "linear-gradient(135deg, #7c3aed, #db2777)",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
  },
  error: {
    padding: 12,
    background: "#3b1d1d",
    color: "#fca5a5",
    borderRadius: 8,
    fontSize: 13,
  },
  imagePanel: { display: "flex", flexDirection: "column", gap: 12 },
  promptBox: {
    padding: 12,
    background: "#161a22",
    border: "1px solid #232936",
    borderRadius: 8,
    fontSize: 13,
    color: "#9aa0a6",
  },
  promptPre: {
    marginTop: 8,
    padding: 12,
    background: "#0f1115",
    color: "#e8eaed",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 12,
    lineHeight: 1.5,
  },
  image: { width: "100%", borderRadius: 12, border: "1px solid #232936" },
};
