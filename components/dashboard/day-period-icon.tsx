import { useId } from "react";

import { type DayPeriod } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

// Soft tiles matching the detail-page icon tiles, tinted per time of day.
const TILE: Record<DayPeriod, string> = {
	morning: "bg-secondary border-secondary-2/60",
	afternoon: "bg-warning/10 border-warning/20",
	evening: "bg-secondary-2/50 border-secondary-3/30",
	night: "bg-accent border-primary/20",
};

const ray = { strokeWidth: 2.5, strokeLinecap: "round" } as const;

export function DayPeriodIcon({
	period,
	className,
}: {
	period: DayPeriod;
	className?: string;
}) {
	return (
		<div
			aria-hidden
			className={cn(
				"flex size-14 shrink-0 items-center justify-center rounded-2xl border shadow-inner",
				TILE[period],
				className,
			)}
		>
			<svg viewBox="0 0 48 48" className="size-10 overflow-visible">
				{period === "morning" ? <Sunrise /> : null}
				{period === "afternoon" ? <Sun /> : null}
				{period === "evening" ? <Sunset /> : null}
				{period === "night" ? <Moon /> : null}
			</svg>
		</div>
	);
}

// Half a sun lifting off the horizon, rays breathing in.
function Sunrise() {
	const clip = useId();
	return (
		// Lifted so the drawing sits on the tile's visual centre.
		<g transform="translate(0 -3)">
			<defs>
				<clipPath id={clip}>
					<rect x="0" y="0" width="48" height="34" />
				</clipPath>
			</defs>
			<g className="stroke-warning motion-safe:animate-breathe" {...ray}>
				<line x1="24" y1="18" x2="24" y2="14" />
				<line x1="35.3" y1="22.7" x2="38.1" y2="19.9" />
				<line x1="12.7" y1="22.7" x2="9.9" y2="19.9" />
				<line x1="39.5" y1="29.9" x2="43.3" y2="28.8" />
				<line x1="8.5" y1="29.9" x2="4.7" y2="28.8" />
			</g>
			<g clipPath={`url(#${clip})`}>
				<circle
					cx="24"
					cy="34"
					r="8"
					className="fill-warning motion-safe:animate-float"
				/>
			</g>
			<line x1="4" y1="34" x2="44" y2="34" className="stroke-secondary-3" {...ray} />
			<line x1="15" y1="40" x2="33" y2="40" className="stroke-secondary-3/50" {...ray} />
		</g>
	);
}

// Full midday sun: a breathing halo and rays turning very slowly.
function Sun() {
	return (
		<>
			<circle
				cx="24"
				cy="24"
				r="12"
				className="fill-warning/20 motion-safe:animate-breathe"
			/>
			<g
				className="origin-center stroke-warning transform-view motion-safe:animate-[spin_40s_linear_infinite]"
				{...ray}
			>
				<line x1="37" y1="24" x2="41" y2="24" />
				<line x1="33.2" y1="33.2" x2="36" y2="36" />
				<line x1="24" y1="37" x2="24" y2="41" />
				<line x1="14.8" y1="33.2" x2="12" y2="36" />
				<line x1="11" y1="24" x2="7" y2="24" />
				<line x1="14.8" y1="14.8" x2="12" y2="12" />
				<line x1="24" y1="11" x2="24" y2="7" />
				<line x1="33.2" y1="14.8" x2="36" y2="12" />
			</g>
			<circle cx="24" cy="24" r="8" className="fill-warning" />
		</>
	);
}

// The sun resting on the horizon, its reflection rippling below.
function Sunset() {
	const clip = useId();
	return (
		// Lifted so the drawing sits on the tile's visual centre.
		<g transform="translate(0 -6)">
			<defs>
				<clipPath id={clip}>
					<rect x="0" y="0" width="48" height="30" />
				</clipPath>
			</defs>
			<g clipPath={`url(#${clip})`}>
				<circle
					cx="24"
					cy="31"
					r="10"
					className="fill-secondary-3 motion-safe:animate-float"
				/>
			</g>
			<line x1="4" y1="30" x2="44" y2="30" className="stroke-primary" {...ray} />
			<line
				x1="15"
				y1="36"
				x2="33"
				y2="36"
				className="stroke-secondary-3/70 motion-safe:animate-breathe"
				{...ray}
			/>
			<line
				x1="20"
				y1="41.5"
				x2="28"
				y2="41.5"
				className="stroke-secondary-3/50 motion-safe:animate-breathe"
				style={{ animationDelay: "1.2s" }}
				{...ray}
			/>
		</g>
	);
}

// A crescent moon floating among slow-twinkling stars.
function Moon() {
	const mask = useId();
	const sparkle = (x: number, y: number, s: number) =>
		`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`;
	return (
		<>
			<defs>
				<mask id={mask}>
					<rect width="48" height="48" fill="white" />
					<circle cx="31" cy="19" r="10" fill="black" />
				</mask>
			</defs>
			<g className="motion-safe:animate-float">
				<circle cx="23" cy="26" r="13" mask={`url(#${mask})`} className="fill-primary" />
			</g>
			<path d={sparkle(37, 11, 4)} className="fill-primary/80 motion-safe:animate-breathe" />
			<path
				d={sparkle(42, 25, 2.5)}
				className="fill-primary/60 motion-safe:animate-breathe"
				style={{ animationDelay: "1.5s" }}
			/>
			<path
				d={sparkle(10, 9, 2.5)}
				className="fill-primary/60 motion-safe:animate-breathe"
				style={{ animationDelay: "2.5s" }}
			/>
		</>
	);
}
