import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deal Compiler — Prompt to approved quote",
  description: "An explainable prompt-to-quote prototype with deterministic pricing and approval policy evaluation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
