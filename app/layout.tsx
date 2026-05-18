import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibe Code Sample — Claude × Gemini Image",
  description: "Claude로 대화하고 Gemini 2.5 Flash Image로 장면을 그려보는 샘플",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
