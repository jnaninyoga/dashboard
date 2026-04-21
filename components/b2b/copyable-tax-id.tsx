"use client";

import { useState } from "react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils/ui";

import { Copy, Hashtag, TickCircle } from "iconsax-reactjs";

interface CopyableTaxIdProps {
	taxId: string;
	className?: string;
}

export function CopyableTaxId({ taxId, className }: CopyableTaxIdProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(taxId);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	return (
		<InputGroup
			className={cn(
				"bg-secondary/60 border-secondary-3/20 w-fit rounded-full",
				className,
			)}
		>
			<InputGroupAddon align="inline-start" className="pr-1.5">
				<Hashtag size={14} variant="Bold" className="text-secondary-3" />
			</InputGroupAddon>
			<InputGroupInput
				value={taxId}
				readOnly
				className="text-secondary-foreground w-fit px-0 font-mono text-sm font-medium"
			/>
			<InputGroupAddon align="inline-end" className="pl-1">
				<InputGroupButton
					aria-label="Copy Tax ID"
					onClick={handleCopy}
					size="icon-xs"
					variant="ghost"
					className="hover:bg-secondary/20 text-secondary-foreground/60 hover:text-secondary-foreground"
				>
					{copied ? (
						<TickCircle size={14} variant="Bold" className="text-primary" />
					) : (
						<Copy size={14} variant="Outline" />
					)}
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	);
}
