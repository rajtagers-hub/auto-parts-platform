"use client";

import { useEffect } from "react";

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Only enable PWA on mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (!isMobile) return;

    // Dynamically inject manifest link (mobile only - PC stays as website)
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.json";
    document.head.appendChild(manifestLink);

    // Register service worker (mobile only)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("PWA Service Worker registration failed:", error);
        });
    }

    return () => {
      // Cleanup manifest link on unmount
      if (manifestLink.parentNode) {
        manifestLink.parentNode.removeChild(manifestLink);
      }
    };
  }, []);

  return null;
}
