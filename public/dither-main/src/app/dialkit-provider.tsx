"use client";

import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { useIsMobile } from "@/lib/use-is-mobile";

export function DialKitProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <>
      {children}
      <DialRoot position={isMobile ? "bottom-left" : "top-right"} />
    </>
  );
}
