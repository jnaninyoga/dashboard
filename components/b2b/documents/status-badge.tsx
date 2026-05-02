import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/ui";

import {
	Clock,
	CloseCircle,
	Edit2,
	MoneyTime,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

interface DocumentStatusBadgeProps {
	status: string;
	className?: string;
}

type BadgeVariant =
	| "default"
	| "secondary"
	| "destructive"
	| "outline"
	| "success"
	| "info"
	| "warning"
	| "muted";

interface StatusProps {
	variant: BadgeVariant;
	icon: ReactNode;
	label: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
	const getStatusProps = (s: string): StatusProps => {
		switch (s.toLowerCase()) {
			case "paid":
				return {
					variant: "success",
					icon: <TickCircle size={14} variant="Bold" />,
					label: "Paid",
				};
			case "unpaid":
				return {
					variant: "warning",
					icon: <Clock size={14} variant="Bold" />,
					label: "Unpaid",
				};
			case "partially_paid":
			case "sent":
				return {
					variant: "info",
					icon: s.toLowerCase() === "sent" ? <Clock size={14} variant="Bold" /> : <MoneyTime size={14} variant="Bold" />,
					label: s.toLowerCase() === "sent" ? "Sent" : "Partially Paid",
				};
			case "accepted":
				return {
					variant: "default", // Primary color to distinguish from "Paid" green
					icon: <ReceiptText size={14} variant="Bold" />,
					label: "Accepted",
				};
			case "cancelled":
				return {
					variant: "destructive",
					icon: <CloseCircle size={14} variant="Bold" />,
					label: "Cancelled",
				};
			case "draft":
			default:
				return {
					variant: "muted",
					icon: <Edit2 size={14} variant="Bold" />,
					label: "Draft",
				};
		}
	};

	const statusProps = getStatusProps(status);

	return (
		<Badge
			variant={statusProps.variant}
			className={cn(
				"flex w-fit items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-all",
				className
			)}
		>
			{statusProps.icon}
			{statusProps.label}
		</Badge>
	);
}
