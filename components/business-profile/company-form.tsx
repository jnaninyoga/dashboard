"use client";

import * as React from "react";
import { useActionState, useEffect, useRef,useState } from "react";
import { getCountries } from "react-phone-number-input";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { PhoneInput } from "@/components/ui/phone-input";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { upsertBusinessProfileAction } from "@/lib/actions/business-profile";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import type { BusinessProfile } from "@/lib/types/b2b";
import { cn } from "@/lib/utils/ui";

import {
	Add,
	Briefcase,
	Buildings,
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

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
	initialData: BusinessProfile | null;
	currentUserName?: string;
}

const DEFAULT_LEGAL_LABELS = ["ICE", "IF", "RC", "Patente"];

export function CompanyProfileForm({
	initialData,
	currentUserName,
	children,
}: Props & { children?: React.ReactNode }) {
	const [state, formAction, _isPending] = useActionState(
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
	const [showBankDetails, setShowBankDetails] = useState(
		initialData?.showBankDetails !== false,
	);

	useEffect(() => {
		if (state?.success) {
			notify.success("Profile saved successfully");
		} else if (state?.error) {
			notifyActionError(state, "Something went wrong");
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
			{children}
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
								<div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
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
						<CardContent className="grid gap-6">
							<div className="grid grid-cols-1 grid-rows-4 gap-2 md:grid-cols-2 md:grid-rows-2">
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
									label="Operator Name"
									id="operator"
									name="operator"
									defaultValue={initialData?.operator || currentUserName || ""}
									placeholder="Representative Name"
									icon={<Personalcard size={18} variant="Bulk" />}
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
									<Label className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
										Phone Number
									</Label>
									<PhoneInput
										placeholder="+212 6 12 34 56 78"
										defaultCountry="MA"
										value={phone}
										onChange={(val) => setPhone(val || "")}

										countries={getCountries().filter(
											(country) => country !== "IL" && country !== "EH",
										)}
										className="h-14"
										inputClassName="rounded-e-md"
										countrySelectClassName="bg-primary/5 border border-r-0 border-primary/15 rounded-s-md text-primary"
									/>
								</div>
								<div className="space-y-2.5 md:col-span-2">
									<Label className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
										Studio Address
									</Label>
									<div className="group relative">
										<div className="absolute top-5 left-4 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary">
											<Location size={18} variant="Bulk" />
										</div>
										<Textarea
											id="address"
											name="address"
											defaultValue={initialData?.address || ""}
											placeholder="Marrakech, Morocco"
											className="max-h-20 min-h-14 ps-12"
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="overflow-hidden" style={{ animationDelay: "200ms" }}>
						<CardHeader>
							<div className="flex items-center gap-4">
								<div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
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
										className="group relative flex animate-slide-up items-center gap-4"
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
												icon={<Hashtag size={18} variant="Bulk" />}
											/>
										</div>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="bg-destructive/5 text-destructive/80 opacity-0 transition-all group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
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
								className="h-12 w-full rounded-2xl border-dashed border-primary/10 bg-primary/2 text-primary transition-all hover:border-primary/20 hover:bg-primary/5"
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
					<Card className="h-full overflow-hidden">
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
										className="cursor-help text-primary opacity-60 transition-opacity hover:opacity-100"
									/>
								</TooltipTrigger>
								<TooltipContent className="max-w-xs space-y-2 rounded-2xl border-secondary/20 bg-card p-4 shadow-xl">
									<div className="flex items-center gap-2">
										<div className="flex w-fit items-center gap-2 rounded-full bg-primary/10 p-2 text-primary">
											<Global size={18} variant="Bulk" />
										</div>
										<h3 className="font-heading text-sm font-bold text-primary">
											Zen Compliance
										</h3>
									</div>
									<p className="text-xs leading-relaxed text-muted-foreground">
										Assets uploaded here will be used to automatically brand
										your Quotes and Invoices with the Zen aesthetic.
									</p>
								</TooltipContent>
							</Tooltip>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Logo Upload */}
							<div className="space-y-3">
								<Label className="ml-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
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
								<Label className="ml-1 text-xs font-bold tracking-widest text-muted-foreground uppercase">
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
							<div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
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
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex flex-col justify-between gap-4 border-b border-secondary/10 pb-6 sm:flex-row sm:items-center">
							<div className="space-y-1">
								<Label className="ml-1 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
									<SecuritySafe
										size={16}
										variant="Bulk"
										className="text-primary"
									/>
									Bank Account Information
								</Label>
								<p className="ml-1 text-[10px] leading-none font-black tracking-widest text-muted-foreground/60 uppercase">
									Toggle to include banking details on quotes and invoices
								</p>
							</div>
							<div className="group flex items-center gap-3 rounded-2xl border border-secondary-2/40 bg-secondary/50 px-4 py-2 transition-all hover:bg-secondary/80 hover:text-secondary-foreground">
								<Label
									htmlFor="showBankDetails"
									className="cursor-pointer text-[10px] font-black tracking-widest uppercase opacity-60 transition-opacity group-hover:opacity-100"
								>
									{showBankDetails ? "Visible" : "Hidden"}
								</Label>
								<Switch
									id="showBankDetails"
									name="showBankDetails"
									checked={showBankDetails}
									onCheckedChange={setShowBankDetails}
									className="data-[state=checked]:bg-primary"
								/>
							</div>
						</div>

						<div
							className={cn(
								"overflow-hidden p-1 transition-all duration-500 ease-in-out",
								showBankDetails
									? "mt-2 max-h-[500px] translate-y-0 opacity-100"
									: "pointer-events-none mt-0 max-h-0 -translate-y-4 opacity-0",
							)}
						>
							<MarkdownEditor
								id="bankDetails"
								name="bankDetails"
								className="rounded-3xl border-secondary/10 shadow-sm"
								defaultValue={initialData?.bankDetails || ""}
								placeholder={`**Bank:** CREDIT DU MAROC\n**Agency:** MARRAKECH GUELIZ\n**Account:** 021.450.0000.03.700.13.95366.50`}
							/>
						</div>
					</CardContent>
				</Card>
			</section>
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
				className="ml-1 text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase"
			>
				{label}
			</Label>
			<div className="group relative">
				{icon ? (
					<div className="absolute top-1/2 left-4 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary">
						{icon}
					</div>
				) : null}
				<Input {...props} className={cn(icon && "pl-12")} />
			</div>
		</div>
	) : (
		<div className="group relative">
			{icon ? (
				<div className="absolute top-1/2 left-4 -translate-y-1/2 text-primary/40 transition-colors group-focus-within:text-primary">
					{icon}
				</div>
			) : null}
			<Input {...props} className={cn(icon && "pl-12")} />
		</div>
	);
}

interface AssetUploaderProps {
	preview: string | null;
	onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onClear: () => void;
	label: string;
	aspect?: "square" | "video";
}

function AssetUploader({
	preview,
	onUpload,
	onClear,
	label,
	aspect = "square",
}: AssetUploaderProps) {

	return (
		<div
			className={cn(
				"group relative flex items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-secondary-2/40 bg-secondary/20 transition-all hover:border-secondary-2/60 hover:bg-secondary/40",
				aspect === "square" ? "aspect-square" : "aspect-video",
			)}
		>
			{preview ? (
				<div className="relative flex size-full items-center justify-center p-4">
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
							className="size-10 rounded-xl"
							onClick={onClear}
						>
							<Trash size={18} />
						</Button>
					</div>
				</div>
			) : (
				<div className="relative flex cursor-pointer flex-col items-center gap-3 p-6 text-center">
					<div className="rounded-2xl bg-secondary p-4 text-secondary-foreground transition-transform group-hover:scale-110">
						<ImageIcon size={32} variant="Bulk" />
					</div>
					<div>
						<p className="mb-1 text-[10px] font-black tracking-widest text-secondary-foreground uppercase">
							Upload {label}
						</p>
						<p className="text-[9px] leading-tight font-medium text-muted-foreground">
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
	formInputProps?: Omit<FormInputProps, "value" | "onChange">;
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
						className={cn(
							"font-bold transition-all placeholder:font-normal",
							formInputProps?.className,
						)}
						placeholder="Label (e.g. ICE)"
						icon={<Civic size={18} variant="Bulk" />}
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
										className="flex cursor-pointer items-center justify-between px-3 py-2 font-bold transition-colors hover:bg-primary/5 data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
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
