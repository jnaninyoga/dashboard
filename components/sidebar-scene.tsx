import { RANGES } from "@/components/ui/lotus-pond";
import { cn } from "@/lib/utils/ui";

/**
 * A still dawn over the High Atlas behind the sidebar's logo: the sign-in
 * scene, small and quiet. The sidebar is a working surface, so its only
 * motion is the sun's glow breathing slowly (none under reduced motion).
 */
export function SidebarScene({ className }: { className?: string }) {
	return (
		<div aria-hidden className={cn("sidebar-scene", className)}>
			<div className="sun-glow" />
			<div className="sun" />
			<svg viewBox="0 0 1600 220" preserveAspectRatio="xMidYMax slice" className="ranges">
				<path d={RANGES.far} style={{ fill: "var(--scene-range-far)" }} />
				<path d={RANGES.mid} style={{ fill: "var(--scene-range-mid)" }} />
				<path d={RANGES.near} style={{ fill: "var(--scene-range-near)" }} />
			</svg>
			<div className="water">
				<div className="sun-path" />
				<div className="glint" style={{ left: "30%", top: "45%", width: "18%" }} />
				<div className="glint" style={{ left: "58%", top: "70%", width: "12%" }} />
			</div>
		</div>
	);
}
