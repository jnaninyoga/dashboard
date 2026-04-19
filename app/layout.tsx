import type { Metadata, Viewport } from "next";
import { Great_Vibes,Philosopher, Plus_Jakarta_Sans } from "next/font/google";

import { OfflineDetector } from "@/components/offline-detector";
import { SerwistRegistration } from "@/components/serwist-registration";

import { Toaster } from "sonner";

import "../styles/globals.css";


const plusJakarta = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta",
	subsets: ["latin"],
	display: "swap",
});

const philosopher = Philosopher({
	weight: ["400", "700"],
	variable: "--font-philosopher",
	subsets: ["latin"],
	display: "swap",
});

const greatVibes = Great_Vibes({
	weight: "400",
	variable: "--font-great-vibes",
	subsets: ["latin"],
	display: "swap",
});

export const viewport: Viewport = {
	themeColor: "#54A5B3",
	width: "device-width",
	initialScale: 1,
};

export const metadata: Metadata = {
	title: "JnaninYoga",
	description: "Digital Command Center",
	applicationName: "JnaninYoga",
	appleWebApp: {
		title: "JnaninYoga",
		statusBarStyle: "default",
	},
	icons: {
		apple: "/logo.png",
	},
	robots: {
		index: false,
		follow: false,
		nocache: true,
		googleBot: {
			index: false,
			follow: false,
			noimageindex: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${plusJakarta.variable} ${philosopher.variable} ${greatVibes.variable} selection:bg-primary/20 font-sans antialiased`}
			>
				{children}
				<SerwistRegistration />
				<Toaster
					richColors
					position="top-center"
					toastOptions={{
						className: "!rounded-2xl !shadow-lg !border-0",
					}}
				/>
				<OfflineDetector />
			</body>
		</html>
	);
}
