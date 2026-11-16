"use client";

import { useEffect } from "react";

import { serviceWorkerEnabled } from "@/lib/utils/service-worker";

export function SerwistRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!serviceWorkerEnabled) {
      // In development a worker left from an earlier run keeps serving old copies of the app's
      // code: the dev server then forces a reload, which the worker answers with the same old
      // code, again and again. Drop it, and what it cached.
      void navigator.serviceWorker.getRegistrations().then((all) => all.forEach((registration) => void registration.unregister()));
      if ("caches" in window) void caches.keys().then((keys) => keys.forEach((key) => void caches.delete(key)));
      return;
    }
    if (window.serwist === undefined) {
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
