"use client";

import { useEffect } from "react";

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Only register PWA on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (!isMobile) return;

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("PWA Service Worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.error("PWA Service Worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
