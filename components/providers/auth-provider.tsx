"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithDemo: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: "demo",
  email: "demo@compass.local",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setUser(DEMO_USER);
      setIsLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const timeout = setTimeout(() => setIsLoading(false), 5000);
    supabase.auth
      .getUser()
      .then(({ data: { user: u } }) => {
        clearTimeout(timeout);
        setUser(u);
        setIsLoading(false);
      })
      .catch((err) => {
        clearTimeout(timeout);
        if (err?.message?.includes("fetch") || err?.name === "TypeError") {
          setUser(DEMO_USER);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!supabase) {
      setUser(DEMO_USER);
      return {};
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      console.error("Google sign-in error:", error);
      return { error: error.message };
    }
    if (data?.url) {
      window.location.href = data.url;
      return {};
    }
    return { error: "No redirect URL received" };
  };

  const signInWithDemo = () => {
    setUser(DEMO_USER);
    setIsLoading(false);
    if (typeof document !== "undefined") {
      document.cookie = "compass-demo-mode=true; path=/; max-age=86400";
    }
  };

  const signOut = async () => {
    if (typeof document !== "undefined") {
      document.cookie = "compass-demo-mode=; path=/; max-age=0";
    }
    if (!supabase) {
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signInWithGoogle, signInWithDemo, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
