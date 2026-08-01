import type { Metadata } from "next";
import "./globals.css";
import { DialKitProvider } from "./dialkit-provider";

export const metadata: Metadata = {
  title: "Dither Playground",
  description:
    "Upload a logo and watch it come alive as interactive dithered particles. Hover to push, click to explode.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DialKitProvider>{children}</DialKitProvider>
      </body>
    </html>
  );
}
