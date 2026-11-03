"use client";

import { LotusPattern, MandalaPattern } from "@/components/schedule/events/patterns";
import { cn } from "@/lib/utils/ui";

// The flower of life as a lattice: circles of one radius, each centred where
// its neighbours cross. One tile is r wide and r·√3 tall; every circle that
// reaches into it is drawn, so the tiles meet without a seam.
const R = 26;
const H = R * Math.sqrt(3);
const LATTICE = Array.from({ length: 7 }, (_, row) => row - 2).flatMap((row) =>
	Array.from({ length: 6 }, (_, col) => col - 2)
		.map((col) => [col * R + (row % 2 ? R / 2 : 0), (row * H) / 2] as const)
		.filter(([x, y]) => x >= -R && x <= 2 * R && y >= -R && y <= H + R),
);

/**
 * The flower-of-life lattice on its own: a quiet ground for a surface that
 * should read apart from the page (the sidebar, the phone's bottom bar). It
 * takes the colour of its text (`currentColor`).
 */
export function PatternLattice({
	id,
	className,
}: {
	/** Unique on the page, and the same on the server and in the browser. */
	id: string;
	className?: string;
}) {
	return (
		<svg aria-hidden className={cn("pointer-events-none absolute inset-0 size-full", className)}>
			<defs>
				<pattern id={id} width={R} height={H} patternUnits="userSpaceOnUse">
					{LATTICE.map(([x, y]) => (
						<circle key={`${x}-${y}`} cx={x} cy={y} r={R} fill="none" stroke="currentColor" strokeWidth="0.6" />
					))}
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill={`url(#${id})`} />
		</svg>
	);
}

/**
 * The sidebar's ground, under everything in it: the lattice over the whole
 * surface, fading where the menu is read, and two of the session cards'
 * motifs bleeding off its edges, the Flower of Life behind the logo and the
 * lotus behind her name. Still: it's a working surface.
 */
export function SidebarPattern() {
	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-sidebar-primary">
			<PatternLattice id="lattice-sidebar" className="mask-[linear-gradient(to_bottom,black,rgb(0_0_0/0.3)_32%,rgb(0_0_0/0.3)_68%,black)] opacity-[0.11]" />
			{/* Past the wordmark and her name, so no line runs through what she reads. */}
			<MandalaPattern className="absolute -top-36 -right-32 size-80 opacity-25 group-data-[collapsible=icon]:hidden" />
			<LotusPattern className="absolute -right-24 -bottom-36 size-72 opacity-20 group-data-[collapsible=icon]:hidden" />
		</div>
	);
}
