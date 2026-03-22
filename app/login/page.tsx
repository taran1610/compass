"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Compass } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const GOOGLE_REDIRECT_URI = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/callback`
  : "";

function LoginContent() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showHelp, setShowHelp] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const authError = searchParams.get("error") === "auth";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/app");
    }
  }, [user, isLoading, router]);

  const copyRedirectUri = () => {
    if (GOOGLE_REDIRECT_URI) {
      navigator.clipboard.writeText(GOOGLE_REDIRECT_URI);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[#6366F1]/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-[#6366F1]/5 blur-3xl" />

      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="border-border/50 bg-card/80 shadow-2xl shadow-black/5 backdrop-blur-xl dark:bg-card/60 dark:shadow-none dark:ring-1 dark:ring-white/5">
          <CardHeader className="space-y-6 pb-2 pt-8 text-center sm:pt-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#4F46E5] text-white shadow-lg shadow-[#6366F1]/25">
              <Compass className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                Compass
              </CardTitle>
              <CardDescription className="text-base">
                AI-powered product management workspace
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-8 pt-4">
            {authError && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sign-in failed. Please try again or check your Google/Supabase configuration.
              </p>
            )}
            <Button
              onClick={async () => {
                setIsSigningIn(true);
                const result = await signInWithGoogle();
                setIsSigningIn(false);
                if (result?.error) {
                  router.replace("/login?error=auth");
                }
              }}
              className="h-12 w-full bg-[#6366F1] text-white hover:bg-[#5558E3] dark:bg-[#6366F1] dark:hover:bg-[#5558E3]"
              size="lg"
              disabled={isSigningIn}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isSigningIn ? "Redirecting to Google…" : "Continue with Google"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link href="#" className="underline hover:text-foreground">Terms</Link>
              {" "}and{" "}
              <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>
            </p>

            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-center text-xs text-muted-foreground underline hover:text-foreground"
            >
              {showHelp ? "Hide" : "Getting redirect_uri_mismatch?"}
            </button>

            {showHelp && GOOGLE_REDIRECT_URI && (
              <div className="rounded-xl border bg-muted/50 p-4 text-left text-xs dark:bg-muted/20">
                <p className="mb-2 font-medium">Add this exact URL in Google Cloud Console:</p>
                <p className="mb-2 break-all font-mono text-[11px] text-muted-foreground">
                  {GOOGLE_REDIRECT_URI}
                </p>
                <Button type="button" variant="secondary" size="sm" onClick={copyRedirectUri}>
                  Copy URL
                </Button>
                <ol className="mt-3 list-inside list-decimal space-y-1 text-muted-foreground">
                  <li>Go to Google Cloud Console → APIs &amp; Services → Credentials</li>
                  <li>Open your OAuth 2.0 Client ID (the one in Supabase Auth → Google)</li>
                  <li>Under &quot;Authorized redirect URIs&quot; click ADD URI</li>
                  <li>Paste the URL above (no trailing slash)</li>
                  <li>Save. Wait 1–2 minutes, then try again in an incognito window.</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
