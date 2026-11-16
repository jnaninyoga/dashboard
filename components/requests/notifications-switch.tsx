"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "@/lib/actions/requests/push";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { urlBase64ToUint8Array } from "@/lib/utils/push";
import { serviceWorkerEnabled } from "@/lib/utils/service-worker";
import { cn } from "@/lib/utils/ui";

import { Notification as BellIcon } from "iconsax-reactjs";

type State = "checking" | "unsupported" | "install" | "blocked" | "off" | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** An iPhone or iPad only allows notifications for a web app opened from the Home Screen. */
function needsInstall() {
	const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches;
	return ios && !standalone;
}

async function registration() {
	return (await window.serwist) ?? (await navigator.serviceWorker.ready);
}

async function readState(): Promise<State> {
	if (!PUBLIC_KEY || !serviceWorkerEnabled || !("serviceWorker" in navigator)) return "unsupported";
	if (needsInstall()) return "install";
	if (!("PushManager" in window) || !("Notification" in window)) return "unsupported";
	if (Notification.permission === "denied") return "blocked";
	const subscription = await (await registration()).pushManager.getSubscription();
	return subscription ? "on" : "off";
}

/**
 * "Notify me on this phone when a booking arrives." Each phone or browser is
 * turned on by itself. With `compact`, nothing shows once it's on (the
 * Bookings page only nudges until she has turned it on; Settings always
 * shows it).
 */
export function NotificationsSwitch({ compact = false, className }: { compact?: boolean; className?: string }) {
	const [state, setState] = useState<State>("checking");
	const [busy, setBusy] = useState(false);
	const id = useId();

	useEffect(() => {
		let live = true;
		readState()
			.then((next) => live && setState(next))
			.catch(() => live && setState("unsupported"));
		return () => {
			live = false;
		};
	}, []);

	const turnOn = useCallback(async () => {
		const permission = await Notification.requestPermission();
		if (permission !== "granted") {
			setState(permission === "denied" ? "blocked" : "off");
			return;
		}
		const subscription = await (await registration()).pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
		});
		const result = await savePushSubscriptionAction(subscription.toJSON());
		if (result.error) {
			await subscription.unsubscribe();
			notifyActionError(result, "Couldn't turn notifications on");
			return;
		}
		setState("on");
		notify.success("Notifications on", "New bookings will show on this phone.");
	}, []);

	const turnOff = useCallback(async () => {
		const subscription = await (await registration()).pushManager.getSubscription();
		if (subscription) {
			const result = await removePushSubscriptionAction(subscription.endpoint);
			if (result.error) {
				notifyActionError(result, "Couldn't turn notifications off");
				return;
			}
			await subscription.unsubscribe();
		}
		setState("off");
	}, []);

	const toggle = async (checked: boolean) => {
		setBusy(true);
		try {
			await (checked ? turnOn() : turnOff());
		} catch (error) {
			notify.error("This browser refused notifications", { error });
		} finally {
			setBusy(false);
		}
	};

	if (state === "checking" || (compact && state === "on")) return null;

	return (
		<div className={cn("flex items-start gap-3 rounded-2xl border bg-card p-4", className)}>
			<BellIcon size={22} variant="Bulk" className="mt-0.5 shrink-0 text-primary" aria-hidden />
			<div className="min-w-0 flex-1 space-y-1">
				{state === "off" || state === "on" ? (
					<div className="flex items-center justify-between gap-4">
						<label htmlFor={id} className="text-sm font-medium text-foreground">
							Notify me on this phone when a booking arrives
						</label>
						<Switch id={id} checked={state === "on"} disabled={busy} onCheckedChange={toggle} />
					</div>
				) : (
					<p className="text-sm font-medium text-foreground">Notifications on this phone</p>
				)}
				<p className="text-sm text-muted-foreground">
					{state === "on"
						? "On. Each booking from the website shows here, even when the dashboard is closed."
						: state === "off"
							? "Each phone or computer is turned on by itself. Email and the count on Bookings work either way."
							: state === "install"
								? "Add the dashboard to your Home Screen first (Share, then Add to Home Screen), open it from there, and turn this on."
								: state === "blocked"
									? "Notifications are blocked for the dashboard. Allow them in this browser's site settings, then come back."
									: "This browser can't show notifications. Email and the count on Bookings still tell you about new bookings."}
				</p>
			</div>
		</div>
	);
}
