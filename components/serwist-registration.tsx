"use client";

import { useEffect } from "react";

export function SerwistRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.serwist === undefined) {
      window.serwist = new Promise((resolve) => {
        navigator.serviceWorker.register("/serwist/sw.js", { scope: "/" }).then(resolve);
      });
    }
  }, []);

  return null;
}

declare global {
  interface Window {
    serwist?: Promise<ServiceWorkerRegistration>;
  }
}
