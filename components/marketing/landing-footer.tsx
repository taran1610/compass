"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

const FOOTER_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-[#1F2937] py-12 px-4">
      <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6366F1] text-white">
            <Compass className="h-4 w-4" />
          </div>
          <span className="font-semibold text-white">Compass</span>
        </Link>
        <nav className="flex items-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-[#9CA3AF]">
          © {new Date().getFullYear()} Compass. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
