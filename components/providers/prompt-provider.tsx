"use client";

import { createContext, useContext, useState } from "react";

type PromptContextType = {
  prompt: string;
  setPrompt: (p: string) => void;
};

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export function PromptProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState("");

  return (
    <PromptContext.Provider value={{ prompt, setPrompt }}>
      {children}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error("usePrompt must be used within a PromptProvider");
  }
  return context;
}
