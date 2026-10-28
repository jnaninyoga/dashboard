"use client";

import { useState } from "react";

import { FormSheet } from "@/components/form-sheet";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import { Buildings } from "iconsax-reactjs";

import { FeedbackDemo } from "./feedback-demo";
import { FormsDemo } from "./forms-demo";

export function Playground() {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [saved, setSaved] = useState<string | null>(null);

	return (
		<TooltipProvider>
			<main className="bg-background mx-auto grid max-w-3xl gap-6 p-4 sm:p-8">
				<h1 className="text-3xl">UI playground</h1>

				<section className="bg-card grid gap-3 rounded-3xl border p-6">
					<h2 className="text-xl">Form sheet</h2>
					<FormSheet
						open={sheetOpen}
						onOpenChange={setSheetOpen}
						trigger={<Button data-testid="open-sheet">New partner</Button>}
						icon={<Buildings size={28} variant="Bulk" />}
						title="Add a Partner"
						description="Create a new company profile for your B2B services."
						footer={
							<Button type="submit" form="demo-form" className="h-11 rounded-xl">
								Create Partner
							</Button>
						}
					>
						<form
							id="demo-form"
							className="grid gap-5"
							onSubmit={(e) => {
								e.preventDefault();
								setSaved(String(new FormData(e.currentTarget).get("companyName")));
								setSheetOpen(false);
							}}
						>
							<div className="grid gap-2">
								<Label htmlFor="companyName">Company Name</Label>
								<Input id="companyName" name="companyName" placeholder="ex: Hotel Villa Taj" />
							</div>
							<div className="grid gap-2">
								<Label>Tier</Label>
								<Select name="tier">
									<SelectTrigger data-testid="tier">
										<SelectValue placeholder="Pick a tier" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="solo">Solo</SelectItem>
										<SelectItem value="family">Famille (3–5 pax)</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</form>
					</FormSheet>
					<p data-testid="saved">Saved: {saved ?? "nothing yet"}</p>
				</section>

				<FeedbackDemo />
				<FormsDemo />

				<section className="bg-card flex flex-wrap items-center gap-3 rounded-3xl border p-6">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline">Dialog</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Dialog</DialogTitle>
								<DialogDescription>Animated by motion.</DialogDescription>
							</DialogHeader>
						</DialogContent>
					</Dialog>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="outline">Alert dialog</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Archive this invoice?</AlertDialogTitle>
								<AlertDialogDescription>It stays in the audit trail.</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction>Archive</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">Dropdown</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem>Edit</DropdownMenuItem>
							<DropdownMenuItem>Archive</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">Popover</Button>
						</PopoverTrigger>
						<PopoverContent>Popover content</PopoverContent>
					</Popover>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="outline">Tooltip</Button>
						</TooltipTrigger>
						<TooltipContent>Tooltip</TooltipContent>
					</Tooltip>

					<Select>
						<SelectTrigger data-testid="ssr-select">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="a">Adult</SelectItem>
							<SelectItem value="b">Student</SelectItem>
						</SelectContent>
					</Select>

					<div className="flex items-center gap-2">
						<Switch id="sw" />
						<Label htmlFor="sw">Switch</Label>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox id="cb" />
						<Label htmlFor="cb">Checkbox</Label>
					</div>
				</section>

				<section className="bg-card grid gap-4 rounded-3xl border p-6">
					<Tabs defaultValue="a">
						<TabsList>
							<TabsTrigger value="a">Profile</TabsTrigger>
							<TabsTrigger value="b">Wallet</TabsTrigger>
						</TabsList>
						<TabsContent value="a">Profile tab</TabsContent>
						<TabsContent value="b">Wallet tab</TabsContent>
					</Tabs>
					<Accordion type="single" collapsible>
						<AccordionItem value="1">
							<AccordionTrigger>Accordion</AccordionTrigger>
							<AccordionContent>Height animated by motion.</AccordionContent>
						</AccordionItem>
					</Accordion>
				</section>
			</main>
		</TooltipProvider>
	);
}
