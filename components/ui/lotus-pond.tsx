import { cn } from "@/lib/utils/ui";

type Depth = "far" | "mid" | "near";

// Far petals are small, faint and slow; near ones large, quick and slightly
// out of focus, so the scene has depth rather than looking like confetti.
const DEPTH: Record<
	Depth,
	{ size: [number, number]; opacity: number; fall: [number, number]; sway: number; flutter: [number, number]; blur: number }
> = {
	far: { size: [12, 16], opacity: 0.55, fall: [30, 38], sway: 22, flutter: [5, 7], blur: 0 },
	mid: { size: [18, 25], opacity: 0.85, fall: [22, 28], sway: 34, flutter: [4, 6], blur: 0 },
	near: { size: [32, 42], opacity: 0.95, fall: [15, 19], sway: 48, flutter: [3.5, 5], blur: 1.5 },
};

const frac = (n: number) => n - Math.floor(n);
const between = ([min, max]: [number, number], t: number) => min + (max - min) * t;

// Golden-ratio spacing spreads the petals evenly with no randomness, so the
// server and the browser draw exactly the same scene.
const PETALS = Array.from({ length: 20 }, (_, i) => {
	const depth: Depth = i % 5 === 0 ? "near" : i % 2 === 0 ? "mid" : "far";
	const d = DEPTH[depth];
	const t = frac(i * 0.618034);
	const u = frac(i * 0.414214 + 0.27);
	const fall = between(d.fall, u);
	return {
		teal: i % 6 === 1,
		left: `${(t * 104 - 4).toFixed(1)}%`,
		size: Math.round(between(d.size, t)),
		blur: d.blur,
		vars: {
			"--petal-opacity": d.opacity,
			"--petal-fall": `${fall.toFixed(1)}s`,
			// Negative delays start each petal mid-fall: the pond is never empty.
			"--petal-delay": `${(-fall * frac(i * 0.7548 + 0.1)).toFixed(1)}s`,
			"--petal-wind": `${Math.round(6 + 10 * u)}vw`,
			"--petal-sway": `${d.sway}px`,
			"--petal-sway-time": `${(4 + 3 * t).toFixed(1)}s`,
			"--petal-flutter-time": `${between(d.flutter, u).toFixed(1)}s`,
			"--petal-tilt": `${Math.round(-40 + 80 * t)}deg`,
			"--petal-rest": `${Math.round(8 + 60 * u)}%`,
		} as React.CSSProperties,
	};
});

// Lily pads sit low, along the bottom edge, so they stay clear of the
// content in the middle on a phone as well.
const BLOOM = { left: "18%", top: "calc(100% - 64px)" };
const BUD = { left: "86%", top: "calc(100% - 118px)" };
const LILIES = [
	{ ...BLOOM, width: "clamp(150px, 19vw, 260px)", flower: "bloom", bob: 8 },
	{ ...BUD, width: "clamp(96px, 10vw, 150px)", flower: "bud", bob: 6.5 },
	{ left: "64%", top: "calc(100% - 26px)", width: "clamp(64px, 7vw, 104px)", flower: null, bob: 7.5 },
] as const;

// Spots on the water that keep sending out rings, three per spot: around the
// lotus and the bud, and on open water where the petals land.
const RIPPLES = [
	{ ...BLOOM, size: 380, time: 10, opacity: 0.85 },
	{ ...BUD, size: 230, time: 8, opacity: 0.7 },
	{ left: "50%", top: "calc(100% - 18px)", size: 480, time: 13, opacity: 0.75 },
	{ left: "72%", top: "74%", size: 200, time: 9, opacity: 0.6 },
];

// Light catching the surface.
const GLINTS = [
	{ left: "8%", top: "70%", width: "22vw", time: 9, delay: 0 },
	{ left: "46%", top: "80%", width: "28vw", time: 12, delay: -4 },
	{ left: "62%", top: "91%", width: "16vw", time: 10, delay: -7 },
];

const PETAL_PATH =
	"M10 1 C14.5 7 18.5 15 17 23 C15.8 29 12.6 31 10 31 C7.4 31 4.2 29 3 23 C1.5 15 5.5 7 10 1 Z";
const VEIN_PATH = "M10 5 C10.6 13 10.6 21 10 29";

// A lotus petal drawn from its base at 0,0 up to its tip.
const BLOOM_PETAL = "M0 0 C-13 -10 -13 -32 0 -46 C13 -32 13 -10 0 0 Z";
// Outer petals open wide and are drawn first; the inner ones stand up.
const BLOOM_ROWS = [
	{ angles: [-74, 74], scale: 0.86, fill: "outer" },
	{ angles: [-44, 44], scale: 1.02, fill: "outer" },
	{ angles: [-17, 17], scale: 1.1, fill: "inner" },
	{ angles: [0], scale: 0.92, fill: "heart" },
] as const;
const BUD_ROWS = [
	{ angles: [-14, 14], scale: 1.08, fill: "outer" },
	{ angles: [0], scale: 1.18, fill: "inner" },
] as const;

/** Pad with its notch, in a 200×120 box; the water line is at y=92. */
const PAD_PATH = "M100 92 L189.6 100.6 A96 24 0 1 1 193.5 97.4 Z";
const PAD_VEINS = [
	"M100 92 L18 98",
	"M100 92 L44 74",
	"M100 92 L124 69",
	"M100 92 L176 78",
	"M100 92 L62 114",
	"M100 92 L150 114",
];

function Lily({ flower }: { flower: "bloom" | "bud" | null }) {
	const rows = flower === "bloom" ? BLOOM_ROWS : flower === "bud" ? BUD_ROWS : [];
	return (
		<svg viewBox="0 0 200 120" className="w-full overflow-visible">
			<path d={PAD_PATH} fill="url(#lotus-pond-pad)" />
			{PAD_VEINS.map((d) => (
				<path
					key={d}
					d={d}
					strokeWidth="1"
					style={{ stroke: "var(--pond-vein)" }}
				/>
			))}
			{rows.flatMap((row) =>
				row.angles.map((angle) => (
					<path
						key={`${row.fill}${angle}`}
						d={BLOOM_PETAL}
						transform={`translate(100 90) rotate(${angle}) scale(${row.scale * 1.45})`}
						fill={`url(#lotus-pond-${row.fill})`}
					/>
				)),
			)}
		</svg>
	);
}

/**
 * Backdrop of the login, error and not-found screens: a lotus pond at dawn.
 * A lotus rests on the water sending out rings, petals tumble down, light
 * glints on the surface and the sky breathes. Decorative only; still under
 * reduced motion.
 */
export function LotusPond({ className }: { className?: string }) {
	return (
		<div aria-hidden className={cn("lotus-pond", className)}>
			<svg width="0" height="0" className="absolute">
				<defs>
					{/* Lotus petals are pale at the base and blush towards the tip. */}
					<linearGradient id="lotus-pond-blush" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" style={{ stopColor: "var(--pond-petal-tip)" }} />
						<stop offset="0.5" style={{ stopColor: "var(--pond-petal)" }} />
						<stop offset="1" style={{ stopColor: "var(--pond-petal-base)" }} />
					</linearGradient>
					<linearGradient id="lotus-pond-teal" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" style={{ stopColor: "var(--pond-teal-tip)" }} />
						<stop offset="0.5" style={{ stopColor: "var(--pond-teal)" }} />
						<stop offset="1" style={{ stopColor: "var(--pond-teal-base)" }} />
					</linearGradient>
					<linearGradient id="lotus-pond-outer" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" style={{ stopColor: "var(--pond-petal-tip)" }} />
						<stop offset="1" style={{ stopColor: "var(--pond-petal-base)" }} />
					</linearGradient>
					<linearGradient id="lotus-pond-inner" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" style={{ stopColor: "var(--pond-petal-deep)" }} />
						<stop offset="0.6" style={{ stopColor: "var(--pond-petal-mid)" }} />
						<stop offset="1" style={{ stopColor: "var(--pond-petal-base)" }} />
					</linearGradient>
					<linearGradient id="lotus-pond-heart" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" style={{ stopColor: "var(--pond-heart)" }} />
						<stop offset="1" style={{ stopColor: "var(--pond-petal-mid)" }} />
					</linearGradient>
					<linearGradient id="lotus-pond-pad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" style={{ stopColor: "var(--pond-leaf)" }} />
						<stop offset="1" style={{ stopColor: "var(--pond-leaf-deep)" }} />
					</linearGradient>
				</defs>
			</svg>

			{/* Dawn light: teal mist and a blush glow, breathing in and out. */}
			<div
				className="dawn"
				style={{
					top: "-24%",
					left: "-18%",
					width: "70vmax",
					height: "70vmax",
					background:
						"radial-gradient(circle, var(--pond-mist), transparent 65%)",
				}}
			/>
			<div
				className="dawn"
				style={{
					top: "-28%",
					right: "-22%",
					width: "64vmax",
					height: "64vmax",
					animationDelay: "-5s",
					background:
						"radial-gradient(circle, var(--pond-dawn), transparent 65%)",
				}}
			/>

			<div className="water" />
			{GLINTS.map((glint) => (
				<span
					key={glint.left}
					className="glint"
					style={{
						left: glint.left,
						top: glint.top,
						width: glint.width,
						animationDuration: `${glint.time}s`,
						animationDelay: `${glint.delay}s`,
					}}
				/>
			))}
			{RIPPLES.flatMap((spot, s) =>
				[0, 1, 2].map((k) => (
					<span
						key={`${s}-${k}`}
						className="ripple"
						style={
							{
								left: spot.left,
								top: spot.top,
								"--ripple-size": `${spot.size}px`,
								"--ripple-time": `${spot.time}s`,
								"--ripple-delay": `${(-(spot.time * k) / 3).toFixed(2)}s`,
								"--ripple-opacity": spot.opacity,
								// Still pond: the three rings rest as concentric circles.
								"--ripple-rest": [0.42, 0.7, 1][k],
							} as React.CSSProperties
						}
					/>
				)),
			)}

			{LILIES.map((lily) => (
				<div
					key={lily.left}
					className="lily"
					style={{ left: lily.left, top: lily.top, width: lily.width }}
				>
					{lily.flower === "bloom" ? <span className="halo" /> : null}
					<div style={{ animationDuration: `${lily.bob}s` }}>
						<Lily flower={lily.flower} />
					</div>
				</div>
			))}

			{PETALS.map((petal, i) => (
				<div
					key={i}
					className="petal"
					style={{ left: petal.left, filter: petal.blur ? `blur(${petal.blur}px)` : undefined, ...petal.vars }}
				>
					<span>
						<svg width={petal.size} height={Math.round(petal.size * 1.6)} viewBox="0 0 20 32">
							<path d={PETAL_PATH} fill={`url(#lotus-pond-${petal.teal ? "teal" : "blush"})`} />
							<path
								d={VEIN_PATH}
								fill="none"
								strokeWidth="0.6"
								strokeLinecap="round"
								style={{
									stroke: `var(--pond-${petal.teal ? "teal" : "petal"}-vein)`,
								}}
							/>
						</svg>
					</span>
				</div>
			))}
		</div>
	);
}
