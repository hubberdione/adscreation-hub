import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Adscreation Hub",
  description: "Multi-brand AI creative production studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/brands" className="text-lg font-semibold">
              Adscreation Hub
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-600">
              <Link href="/brands" className="hover:text-black">
                Brands
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
