import Link from "next/link";

import { EventForm } from "@/components/events/event-form";
import { requireUser } from "@/lib/auth/require-user";
import { eventFormValues } from "@/lib/domain/events/form";

import { ArrowLeft } from "iconsax-reactjs";

export default async function NewEventPage() {
	await requireUser();
	return (
		<>
			<Link href="/website/events" className="-ml-2 flex h-10 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
				<ArrowLeft size={18} />
				Events
			</Link>
			<header className="space-y-1">
				<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">New event</h1>
				<p className="text-md text-muted-foreground">Save it as a draft while you write; publish it when it&apos;s ready for the website.</p>
			</header>
			<EventForm id={null} initial={eventFormValues(null)} status={null} />
		</>
	);
}
