import { NotificationsSwitch } from "@/components/requests/notifications-switch";

export default function NotificationsSettingsPage() {
	return (
		<>
			<header className="space-y-1">
				<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Notifications</h1>
				<p className="text-md text-muted-foreground">
					How you hear about a booking from the website: on this phone, by email to contact@, and in the count on Bookings.
				</p>
			</header>

			<NotificationsSwitch className="max-w-xl" />
		</>
	);
}
