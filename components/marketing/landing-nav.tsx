"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
];

export function LandingNav() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1F2937]/60 bg-[#0A0A0A]/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366F1] text-white">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">Compass</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link href="/app">
              <Button
                size="sm"
                className="bg-[#6366F1] hover:bg-[#5558E3] text-white border-0 font-medium"
              >
                Go to App
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#9CA3AF] hover:text-white hover:bg-white/5 border border-[#1F2937]/60"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-[#6366F1] hover:bg-[#5558E3] text-white border-0 font-medium"
                >
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
