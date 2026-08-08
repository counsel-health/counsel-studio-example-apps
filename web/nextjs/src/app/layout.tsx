import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { fontBody } from "./fonts";

export const metadata: Metadata = {
  title: "Studio Demo",
  description: "Studio Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
