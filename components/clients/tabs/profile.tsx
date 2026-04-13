import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Client } from "@/drizzle/schema";

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
					<CardTitle className="text-primary flex items-center gap-2 text-lg">
						<User className="text-primary h-5 w-5" variant="Bulk" />
						Contact Information
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					{/* Phone & WhatsApp Row */}
					<div className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex items-center justify-between gap-4 rounded-2xl border border-transparent p-3 transition-all hover:bg-white">
						<div className="flex items-center gap-3">
							<div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
								<Phone className="h-5 w-5" variant="Bold" />
							</div>
							<div className="flex flex-col">
								<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
									Phone Number
								</span>
								<Link
									href={`tel:${client.phone}`}
									className="hover:text-primary text-base font-semibold transition-colors"
								>
									{client.phone}
								</Link>
							</div>
						</div>
						<Link
							href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
							target="_blank"
							className="group/wa flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#25D366] transition-all hover:scale-110 hover:bg-[#25D366] hover:text-white active:scale-95"
						>
							<Whatsapp className="h-6 w-6" variant="Bold" />
						</Link>
					</div>

					{/* Email Row */}
					{client.email ? (
						<Link
							href={`mailto:${client.email}`}
							className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all hover:bg-white"
						>
							<div className="bg-secondary/40 text-secondary-3 group-hover:bg-secondary/70 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
								<Mail className="h-5 w-5" variant="Bold" />
							</div>
							<div className="flex max-w-[calc(100%-60px)] flex-col">
								<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
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
						<div className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-all hover:bg-white">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
								<MapPin className="h-5 w-5" variant="Bold" />
							</div>
							<div className="flex flex-col">
								<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
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
					<CardTitle className="text-primary flex items-center gap-2 text-lg font-bold">
						<Calendar className="text-primary h-5 w-5" variant="Bulk" />
						Personal Details
					</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					{/* Birth Date Row */}
					<div className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all hover:bg-white">
						<div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
							<Calendar className="h-5 w-5" variant="Bold" />
						</div>
						<div className="flex flex-col">
							<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
								Date of Birth
							</span>
							<span className="text-base font-semibold">
								{client.birthDate}
							</span>
						</div>
					</div>

					{/* Profession Row */}
					{client.profession ? (
						<div className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all hover:bg-white">
							<div className="bg-secondary/40 text-secondary-3 group-hover:bg-secondary/70 flex h-10 w-10 items-center justify-center rounded-xl transition-colors">
								<Briefcase className="h-5 w-5" variant="Bold" />
							</div>
							<div className="flex flex-col">
								<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
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
						<div className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex flex-col gap-1 rounded-2xl border border-transparent p-3 transition-all hover:bg-white">
							<div className="flex items-center gap-2">
								<Profile2User
									className="text-secondary-2 h-4 w-4"
									variant="Bold"
								/>
								<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
									Referral Source
								</span>
							</div>
							<span className="text-sm font-semibold capitalize">
								{client.referralSource?.replace("_", " ") || "N/A"}
							</span>
						</div>
						<div className="group bg-sidebar/50 hover:border-primary/10 hover:zen-glow-teal flex flex-col gap-1 rounded-2xl border border-transparent p-3 transition-all hover:bg-white">
							<div className="flex items-center gap-2">
								<Calendar className="text-accent h-4 w-4" variant="Bold" />
								<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-60">
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
					<CardTitle className="text-primary flex items-center gap-2 text-lg">
						<FileText className="text-primary h-5 w-5" variant="Bulk" />
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
