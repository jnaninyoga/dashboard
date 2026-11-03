import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { whatsappHref } from "@/lib/utils/contact";
import { type Client } from "@/services/database/schema";

import {
	Briefcase,
	Calendar,
	Call as Phone,
	DocumentText as FileText,
	Location as MapPin,
	Profile2User,
	Sms as Mail,
	User,
	Whatsapp,
} from "iconsax-reactjs";

interface ProfileTabProps {
	client: Client;
}

export function ProfileTab({ client }: ProfileTabProps) {
	return (
		<div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
			{/* Contact Info Card */}
			<Card className="border-none shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg text-primary">
						<User className="size-5 text-primary" variant="Bulk" />
						Contact Information
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					{/* Phone & WhatsApp Row */}
					<div className="group hover:zen-glow-teal flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card">
						<div className="flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
								<Phone className="size-5" variant="Bold" />
							</div>
							<div className="flex flex-col">
								<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
									Phone Number
								</span>
								<Link
									href={`tel:${client.phone}`}
									className="text-base font-semibold transition-colors hover:text-primary"
								>
									{client.phone}
								</Link>
							</div>
						</div>
						<Link
							href={whatsappHref(client.phone)}
							target="_blank"
							className="group/wa flex size-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-all hover:scale-110 hover:bg-[#25D366] hover:text-white active:scale-95"
						>
							<Whatsapp className="size-6" variant="Bold" />
						</Link>
					</div>

					{/* Email Row */}
					{client.email ? (
						<Link
							href={`mailto:${client.email}`}
							className="group hover:zen-glow-teal flex items-center gap-4 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card"
						>
							<div className="flex size-10 items-center justify-center rounded-xl bg-secondary/40 text-secondary-3 transition-colors group-hover:bg-secondary/70">
								<Mail className="size-5" variant="Bold" />
							</div>
							<div className="flex max-w-[calc(100%-60px)] flex-col">
								<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
									Email Address
								</span>
								<span className="truncate text-base font-semibold">
									{client.email}
								</span>
							</div>
						</Link>
					) : null}

					{/* Address Row */}
					{client.address ? (
						<div className="group hover:zen-glow-teal flex items-start gap-4 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info transition-colors group-hover:bg-info/10">
								<MapPin className="size-5" variant="Bold" />
							</div>
							<div className="flex flex-col">
								<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
									Mailing Address
								</span>
								<span className="text-sm leading-tight font-medium">
									{client.address}
								</span>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Personal Details Card */}
			<Card className="border-none shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
						<Calendar className="size-5 text-primary" variant="Bulk" />
						Personal Details
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					{/* Birth Date Row */}
					<div className="group hover:zen-glow-teal flex items-center gap-4 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card">
						<div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
							<Calendar className="size-5" variant="Bold" />
						</div>
						<div className="flex flex-col">
							<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
								Date of Birth
							</span>
							<span className="text-base font-semibold">
								{client.birthDate}
							</span>
						</div>
					</div>

					{/* Profession Row */}
					{client.profession ? (
						<div className="group hover:zen-glow-teal flex items-center gap-4 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card">
							<div className="flex size-10 items-center justify-center rounded-xl bg-secondary/40 text-secondary-3 transition-colors group-hover:bg-secondary/70">
								<Briefcase className="size-5" variant="Bold" />
							</div>
							<div className="flex flex-col">
								<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
									Profession
								</span>
								<span className="text-base font-semibold capitalize">
									{client.profession}
								</span>
							</div>
						</div>
					) : null}

					{/* Referral & Date Grid */}
					<div className="grid grid-cols-2 gap-4">
						<div className="group hover:zen-glow-teal flex flex-col gap-1 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card">
							<div className="flex items-center gap-2">
								<Profile2User
									className="size-4 text-secondary-3"
									variant="Bold"
								/>
								<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
									Referral Source
								</span>
							</div>
							<span className="text-sm font-semibold capitalize">
								{client.referralSource?.replace("_", " ") || "N/A"}
							</span>
						</div>
						<div className="group hover:zen-glow-teal flex flex-col gap-1 rounded-2xl border border-transparent bg-muted/30 p-3 transition-all hover:border-primary/10 hover:bg-card">
							<div className="flex items-center gap-2">
								<Calendar className="size-4 text-accent" variant="Bold" />
								<span className="text-[10px] font-bold tracking-wider text-secondary-foreground uppercase opacity-60">
									Client Since
								</span>
							</div>
							<span className="text-sm font-semibold">
								{new Date(client.createdAt).toLocaleDateString()}
							</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Consultation Reason Card */}
			<Card className="md:col-span-2">
				<CardHeader className="pb-4">
					<CardTitle className="flex items-center gap-2 text-lg text-primary">
						<FileText className="size-5 text-primary" variant="Bulk" />
						Consultation Reason
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-base">
						{client.consultationReason || "No specific reason recorded."}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
