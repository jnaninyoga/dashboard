"use client";

import { useState } from "react";

import { useConfirm } from "@/components/feedback/confirm";
import { Button } from "@/components/ui/button";
import { notify, notifyActionError } from "@/lib/feedback/notify";

function Crash(): never {
	throw new Error("Playground crash: cannot read properties of undefined (reading 'wallets')");
}

export function FeedbackDemo() {
	const confirm = useConfirm();
	const [answer, setAnswer] = useState("none");
	const [crash, setCrash] = useState(false);

	return (
		<section className="bg-card flex flex-wrap items-center gap-3 rounded-3xl border p-6">
			<h2 className="w-full text-xl">Feedback</h2>
			<Button
				variant="outline"
				onClick={() => notify.success("Payment recorded", "INV-2026-004 is now paid.")}
			>
				Success toast
			</Button>
			<Button variant="outline" onClick={() => notify.error("Enter a positive amount")}>
				Plain error
			</Button>
			<Button
				variant="outline"
				onClick={() =>
					notifyActionError({ error: "Failed to record payment", ref: "JY-7K2Q9M" }, "Failed")
				}
			>
				Failed action
			</Button>
			<Button
				variant="outline"
				onClick={async () => {
					const ok = await confirm({
						title: "Delete draft DEV-2026-012?",
						description: "This can't be undone.",
						confirmLabel: "Delete draft",
						destructive: true,
					});
					setAnswer(ok ? "confirmed" : "cancelled");
				}}
			>
				Confirm
			</Button>
			<span data-testid="confirm-answer">Answer: {answer}</span>
			<Button variant="destructive" onClick={() => setCrash(true)}>
				Crash this page
			</Button>
			{crash ? <Crash /> : null}
		</section>
	);
}
