/**
 * Whether the app runs its service worker (installing on a phone, notifications
 * of new bookings). Only in production: in development it would cache code that
 * changes with every edit, and the page would reload forever. Set
 * NEXT_PUBLIC_SERVICE_WORKER_IN_DEV=1 to try notifications locally.
 */
export const serviceWorkerEnabled = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SERVICE_WORKER_IN_DEV === "1";
