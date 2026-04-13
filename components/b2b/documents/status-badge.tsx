import { Badge } from "@/components/ui/badge";

import {
	Clock,
	CloseCircle,
	Edit2,
	ReceiptText,
	TickCircle,
} from "iconsax-reactjs";

interface DocumentStatusBadgeProps {
	status: string;
	className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
	const getStatusProps = (s: string) => {
		switch (s.toLowerCase()) {
			case "paid":
				return {
					variant: "success" as const,
					icon: <TickCircle size={14} variant="Bold" />,
					label: "Paid",
				};
			case "accepted":
				return {
					variant: "success" as const,
					icon: <ReceiptText size={14} variant="Bold" />,
					label: "Accepted",
				};
			case "sent":
				return {
					variant: "info" as const,
					icon: <Clock size={14} variant="Bold" />,
					label: "Sent",
				};
			case "cancelled":
				return {
					variant: "destructive" as const,
					icon: <CloseCircle size={14} variant="Bold" />,
					label: "Cancelled",
				};
			case "draft":
			default:
				return {
					variant: "muted" as const,
					icon: <Edit2 size={14} variant="Bold" />,
					label: "Draft",
				};
		}
	};

	const statusProps = getStatusProps(status);

	return (
		<Badge
			variant={statusProps.variant}
			className={`flex w-fit items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase transition-all ${className || ""}`}
		>
			{statusProps.icon}
			{statusProps.label}
		</Badge>
	);
}
