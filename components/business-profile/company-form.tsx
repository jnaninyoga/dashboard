"use client";

import * as React from "react";
import { useActionState, useEffect, useState, useRef } from "react";
import { getCountries } from "react-phone-number-input";
import Image from "next/image";

import { upsertBusinessProfileAction } from "@/actions/business-profile";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import type { BusinessProfile } from "@/lib/types/b2b";
import { cn } from "@/lib/utils";

import {
	Add,
	Briefcase,
	Buildings,
	Call,
	Civic,
	DocumentText1,
	Global,
	Hashtag,
	Image as ImageIcon,
	InfoCircle,
	Location,
	Message,
	Personalcard,
	SecuritySafe,
	Trash,
} from "iconsax-reactjs";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";

interface Props {
	initialData: BusinessProfile | null;
}

const DEFAULT_LEGAL_LABELS = ["ICE", "IF", "RC", "Patente"];

export function CompanyProfileForm({ initialData }: Props) {
	const [state, formAction, isPending] = useActionState(
		upsertBusinessProfileAction,
		null,
	);

	const [legalDetails, setLegalDetails] = useState<
		{ label: string; value: string }[]
	>(initialData?.legalDetails || []);

	const [logoPreview, setLogoPreview] = useState<string | null>(
		initialData?.logoBase64 || null,
	);
	const [signaturePreview, setSignaturePreview] = useState<string | null>(
		initialData?.signatureBase64 || null,
	);
	const [phone, setPhone] = useState(initialData?.phone || "");

	useEffect(() => {
		if (state?.success) {
			toast.success("Profile saved successfully");
		} else if (state?.error) {
			toast.error(state.error);
		}
	}, [state]);

	const handleImageUpload = (
		e: React.ChangeEvent<HTMLInputElement>,
		setPreview: (val: string) => void,
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			if (typeof event.target?.result === "string") {
				setPreview(event.target.result);
			}
		};
		reader.readAsDataURL(file);
	};

	return (
		<form action={formAction} className="relative space-y-10 pb-20">
			{initialData?.id ? (
				<input type="hidden" name="id" value={initialData.id} />
			) : null}
			<input
				type="hidden"
				name="legalDetails"
				value={JSON.stringify(legalDetails)}
			/>
			<input type="hidden" name="logoBase64" value={logoPreview || ""} />
			<input
				type="hidden"
				name="signatureBase64"
				value={signaturePreview || ""}
			/>
			<input type="hidden" name="phone" value={phone} />

			{/* Section 1: Studio Identity & Branding */}
			<div className="grid gap-8 lg:grid-cols-3">
				<div
					className="animate-slide-up space-y-8 lg:col-span-2"
					style={{ animationDelay: "100ms" }}
				>
					<Card className="overflow-hidden">
						<CardHeader>
							<div className="flex items-center gap-4">
								<div className="bg-primary/10 text-primary rounded-2xl p-2.5">
									<Personalcard size={24} variant="Bulk" />
								</div>
								<div>
									<CardTitle className="font-heading text-xl font-bold tracking-tight">
										Studio Identity
									</CardTitle>
									<CardDescription>
										General information and contact details.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="grid gap-8">
							<div className="grid gap-6 md:grid-cols-2">
								<FormInput
									label="Company Name"
									id="companyName"
									name="companyName"
									defaultValue={initialData?.companyName || ""}
									placeholder="JnaninYoga Studio"
									required
									icon={<Buildings size={18} variant="Bulk" />}
								/>
								<FormInput
									label="Email Address"
									id="email"
									name="email"
									type="email"
									defaultValue={initialData?.email || ""}
									placeholder="contact@jnaninyoga.com"
									icon={<Message size={18} variant="Bulk" />}
								/>
								<div className="space-y-2.5">
									<Label className="text-muted-foreground/60 ml-1 text-[10px] font-black tracking-widest uppercase">
										Phone Number
									</Label>
									<PhoneInput
										placeholder="+212 6 12 34 56 78"
										defaultCountry="MA"
										value={phone as any}
										onChange={(val) => setPhone(val || "")}
										countries={getCountries().filter(
											(country) => country !== "IL" && country !== "EH",
										)}
										className="h-14"
										inputClassName="rounded-e-md"
										countrySelectClassName="bg-primary/5 border border-r-0 border-primary/15 rounded-s-md text-primary"
									/>
								</div>
								<FormInput
									label="Studio Address"
									id="address"
									name="address"
									defaultValue={initialData?.address || ""}
									placeholder="Marrakech, Morocco"
									icon={<Location size={18} variant="Bulk" />}
								/>
							</div>
						</CardContent>
					</Card>

					<Card
						className="overflow-hidden"
						style={{ animationDelay: "200ms" }}
					>
						<CardHeader>
							<div className="flex items-center gap-4">
								<div className="bg-primary/10 text-primary rounded-2xl p-2.5">
									<Briefcase size={24} variant="Bulk" />
								</div>
								<div>
									<CardTitle className="font-heading text-xl font-bold tracking-tight">
										Legal Identifiers
									</CardTitle>
									<CardDescription>
										Configure ICE, Patent, IF and other legal numbers.
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								{legalDetails.map((detail, idx) => (
									<div
										key={idx}
										className="group animate-slide-up relative flex items-center gap-4"
										style={{ animationDelay: `${250 + idx * 50}ms` }}
									>
										<div className="flex-1">
											<LegalLabelAutocomplete
												value={detail.label}
												onChange={(val) => {
													const newArr = [...legalDetails];
													newArr[idx].label = val;
													setLegalDetails(newArr);
												}}
											/>
										</div>
										<div className="flex-2">
											<FormInput
												id={`legalValue-${idx}`}
												name={`legalValue-${idx}`}
												placeholder="Legal Value"
												value={detail.value}
												onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
													const newArr: typeof legalDetails = [...legalDetails];
													newArr[idx].value = e.target.value;
													setLegalDetails(newArr);
												}}
												icon={<Hashtag size={18} variant="Bulk"/>}
											/>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="bg-destructive/5 text-destructive/80 opacity-0 transition-all hover:text-destructive hover:bg-destructive/10 group-hover:opacity-100 group-focus-within:opacity-100"
											onClick={() => {
												setLegalDetails(
													legalDetails.filter((_, i) => i !== idx),
												);
											}}
										>
											<Trash size={20} variant="Bold" />
										</Button>
									</div>
								))}
							</div>

							<Button
								type="button"
								variant="outline"
								className="border-primary/10 bg-primary/2 hover:bg-primary/5 hover:border-primary/20 text-primary h-12 w-full rounded-2xl border-dashed transition-all"
								onClick={() =>
									setLegalDetails([...legalDetails, { label: "", value: "" }])
								}
							>
								<Add size={20} />
								<span className="font-medium tracking-tight">
									Add Legal Identifier
								</span>
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar: Assets */}
				<div
					className="animate-slide-left space-y-6"
					style={{ animationDelay: "300ms" }}
				>
					<Card className="overflow-hidden">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="font-heading text-xl font-bold tracking-tight">
									Studio Assets
								</CardTitle>
								<CardDescription>Branding for your Documents.</CardDescription>
							</div>
							<Tooltip>
								<TooltipTrigger asChild>
									<InfoCircle
										size={20}
										variant="Bulk"
										className="text-primary cursor-help opacity-60 transition-opacity hover:opacity-100"
									/>
								</TooltipTrigger>
								<TooltipContent className="bg-card border-secondary/20 max-w-xs space-y-2 rounded-2xl p-4 shadow-xl">
									<div className="flex items-center gap-2">
										<div className="bg-primary/10 text-primary flex w-fit items-center gap-2 rounded-full p-2">
											<Global size={18} variant="Bulk" />
										</div>
										<h3 className="font-heading text-primary text-sm font-bold">
											Zen Compliance
										</h3>
									</div>
									<p className="text-muted-foreground text-xs leading-relaxed">
										Assets uploaded here will be used to automatically brand
										your Quotes and Invoices with the Zen aesthetic.
									</p>
								</TooltipContent>
							</Tooltip>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Logo Upload */}
							<div className="space-y-3">
								<Label className="text-muted-foreground ml-1 text-xs font-bold tracking-widest uppercase">
									Studio Logo
								</Label>
								<AssetUploader
									preview={logoPreview}
									onUpload={(e: React.ChangeEvent<HTMLInputElement, Element>) =>
										handleImageUpload(e, setLogoPreview)
									}
									onClear={() => setLogoPreview(null)}
									label="STUDO LOGO"
								/>
							</div>

							{/* Signature Upload */}
							<div className="space-y-3">
								<Label className="text-muted-foreground ml-1 text-xs font-bold tracking-widest uppercase">
									Official Stamp/Signature
								</Label>
								<AssetUploader
									preview={signaturePreview}
									onUpload={(e: React.ChangeEvent<HTMLInputElement, Element>) =>
										handleImageUpload(e, setSignaturePreview)
									}
									onClear={() => setSignaturePreview(null)}
									label="SIGNATURE"
									aspect="video"
								/>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Section 2: Document Configuration */}
			<section className="animate-slide-up" style={{ animationDelay: "400ms" }}>
				<Card className="overflow-hidden">
					<CardHeader className="flex flex-row items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="bg-primary/10 text-primary rounded-2xl p-2.5">
								<DocumentText1 size={24} variant="Bulk" />
							</div>
							<div>
								<CardTitle className="font-heading text-xl font-bold tracking-tight">
									PDF Document Configuration
								</CardTitle>
								<CardDescription>
									Configure bank details and global footers.
								</CardDescription>
							</div>
						</div>
						<div className="flex flex-col items-end gap-1.5 pt-1">
							<Label className="text-muted-foreground text-[10px] font-black tracking-widest uppercase opacity-60">
								Show Bank Details
							</Label>
							<Switch
								name="showBankDetails"
								className="data-[state=checked]:bg-primary"
								defaultChecked={initialData?.showBankDetails !== false}
							/>
						</div>
					</CardHeader>
					<CardContent className="grid gap-10 md:grid-cols-2">
						<div className="space-y-4">
							<Label className="text-secondary-3 ml-1 text-xs font-black tracking-widest uppercase">
								Bank Account Information
							</Label>
							<MarkdownEditor
								id="bankDetails"
								name="bankDetails"
								className="rounded-3xl border-secondary/10 shadow-sm"
								defaultValue={initialData?.bankDetails || ""}
								placeholder={`**Bank:** CREDIT DU MAROC\n**Agency:** MARRAKECH GUELIZ\n**Account:** 021.450.0000.03.700.13.95366.50`}
							/>
						</div>
						<div className="space-y-4">
							<Label className="text-secondary-3 ml-1 text-xs font-black tracking-widest uppercase">
								Global Document Footer
							</Label>
							<MarkdownEditor
								id="documentFooterText"
								name="documentFooterText"
								className="rounded-3xl border-secondary/10 shadow-sm"
								defaultValue={initialData?.documentFooterText || ""}
								placeholder={`Imm. 24, Angle Bd Allal El Fassi et Yacoub El Mansour\nTel : +212 661 286 464 - Mail : contact@jnaninyoga.com`}
							/>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Sticky Actions Bar */}
			<div
				className="animate-slide-up fixed right-6 bottom-8 left-6 z-50 flex justify-end"
				style={{ animationDelay: "500ms" }}
			>
				<div className="zen-glass border-secondary/20 flex items-center gap-6 rounded-3xl border p-4 shadow-2xl">
					<p className="text-muted-foreground hidden px-4 text-xs font-medium md:block">
						Changes are reflected instantly on generated documents.
					</p>
					<Button
						type="submit"
						disabled={isPending}
						size="lg"
						className="zen-glow-teal h-14 rounded-2xl px-12 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
					>
						{isPending ? "Persisting Changes..." : "Save Business Profile"}
					</Button>
				</div>
			</div>
		</form>
	);
}

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	icon?: React.ReactNode;
};

function FormInput({ label, icon, ...props }: FormInputProps) {
	return label ? (
		<div className="space-y-2.5">
			<Label
				htmlFor={props.id}
				className="text-muted-foreground/60 ml-1 text-[10px] font-black tracking-widest uppercase"
			>
				{label}
			</Label>
			<div className="group relative">
				{icon ? (
					<div className="text-primary/40 group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors">
						{icon}
					</div>
				) : null}
				<Input {...props} className={cn(icon && "pl-12")} />
			</div>
		</div>
		) : (			
		<div className="group relative">
			{icon ? (
				<div className="text-primary/40 group-focus-within:text-primary absolute top-1/2 left-4 -translate-y-1/2 transition-colors">
					{icon}
				</div>
			) : null}
			<Input {...props} className={cn(icon && "pl-12")} />
		</div>
	);
}

function AssetUploader({
	preview,
	onUpload,
	onClear,
	label,
	aspect = "square",
}: any) {
	return (
		<div
			className={cn(
				"group border-secondary-2/40 bg-secondary/20 hover:bg-secondary/40 hover:border-secondary-2/60 relative flex items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed transition-all",
				aspect === "square" ? "aspect-square" : "aspect-video",
			)}
		>
			{preview ? (
				<div className="relative flex h-full w-full items-center justify-center p-4">
					<Image
						src={preview}
						alt="Preview"
						fill
						className="object-contain p-6"
						unoptimized
					/>
					<div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							className="h-10 gap-2 rounded-xl font-bold"
						>
							<ImageIcon size={16} /> Replace
							<input
								type="file"
								accept="image/*"
								className="absolute inset-0 cursor-pointer opacity-0"
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onUpload(e)
								}
							/>
						</Button>
						<Button
							type="button"
							variant="destructive"
							size="icon"
							className="h-10 w-10 rounded-xl"
							onClick={onClear}
						>
							<Trash size={18} />
						</Button>
					</div>
				</div>
			) : (
				<div className="relative flex cursor-pointer flex-col items-center gap-3 p-6 text-center">
					<div className="bg-secondary text-secondary-foreground rounded-2xl p-4 transition-transform group-hover:scale-110">
						<ImageIcon size={32} variant="Bulk" />
					</div>
					<div>
						<p className="text-secondary-foreground mb-1 text-[10px] font-black tracking-widest uppercase">
							Upload {label}
						</p>
						<p className="text-muted-foreground text-[9px] leading-tight font-medium">
							Click or drag & drop PNG/JPG
						</p>
					</div>
					<input
						type="file"
						accept="image/*"
						className="absolute inset-0 cursor-pointer opacity-0"
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpload(e)}
					/>
				</div>
			)}
		</div>
	);
}

function LegalLabelAutocomplete({
	value,
	onChange,
	formInputProps,
}: {
	value: string;
	onChange: (val: string) => void;
	formInputProps?: Omit<FormInputProps, 'value' | 'onChange'>;
}) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<div ref={containerRef} className="relative w-full">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverAnchor asChild>
					<FormInput
						{...formInputProps}
						value={value}
						onChange={(e) => {
							onChange(e.target.value);
							if (!open) setOpen(true);
						}}
						onFocus={() => setOpen(true)}
						className={cn("font-bold transition-all placeholder:font-normal", formInputProps?.className)}
						placeholder="Label (e.g. ICE)"
						icon={<Civic size={18} variant="Bulk"/>}
					/>
				</PopoverAnchor>
				<PopoverContent
					className="border p-0"
					style={{ width: "var(--radix-popover-anchor-width)" }}
					onOpenAutoFocus={(e) => e.preventDefault()}
				>
					<Command className="bg-card">
						<CommandList className="max-h-48">
							<CommandEmpty>Custom Label: &quot;{value}&quot;</CommandEmpty>
							<CommandGroup>
								{DEFAULT_LEGAL_LABELS.filter((lbl) =>
									lbl.toLowerCase().includes(value.toLowerCase()),
								).map((lbl) => (
									<CommandItem
										key={lbl}
										value={lbl}
										onSelect={() => {
											onChange(lbl);
											setOpen(false);
										}}
										className="hover:bg-primary/5 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary flex cursor-pointer items-center justify-between px-3 py-2 transition-colors font-bold"
									>
										<span className="text-xs">{lbl}</span>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
