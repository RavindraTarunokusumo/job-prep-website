"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TrialModal } from "./trial-modal";

type TrialModalContextValue = {
  openTrial: () => void;
};

const TrialModalContext = createContext<TrialModalContextValue | null>(null);

export function TrialModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openTrial = useCallback(() => setOpen(true), []);

  const value = useMemo(() => ({ openTrial }), [openTrial]);

  return (
    <TrialModalContext.Provider value={value}>
      {children}
      <TrialModal open={open} onOpenChange={setOpen} />
    </TrialModalContext.Provider>
  );
}

export function useTrialModal() {
  const context = useContext(TrialModalContext);
  if (!context) {
    throw new Error("useTrialModal must be used within TrialModalProvider");
  }
  return context;
}