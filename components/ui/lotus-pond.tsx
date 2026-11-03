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
const PETALS = Array.from({ length: 18 }, (_, i) => {
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

// The High Atlas behind Marrakech, three ranges paling with distance. Fixed
// ridgelines (not computed), so every engine draws the same outline.
export const RANGES = {
	far: "M0 220 L0 129 L25 129 L50 119 L75 102 L100 94 L125 84 L150 81 L175 81 L200 77 L225 82 L250 96 L275 98 L300 105 L325 98 L350 100 L375 97 L400 84 L425 81 L450 70 L475 51 L500 43 L525 44 L550 46 L575 39 L600 33 L625 26 L650 11 L675 4 L700 7 L725 21 L750 40 L775 63 L800 80 L825 91 L850 90 L875 84 L900 87 L925 80 L950 77 L975 69 L1000 77 L1025 77 L1050 74 L1075 83 L1100 95 L1125 102 L1150 108 L1175 101 L1200 96 L1225 78 L1250 55 L1275 38 L1300 27 L1325 19 L1350 17 L1375 26 L1400 31 L1425 44 L1450 57 L1475 60 L1500 63 L1525 73 L1550 84 L1575 95 L1600 104 L1600 220Z",
	mid: "M0 220 L0 133 L25 128 L50 116 L75 112 L100 116 L125 115 L150 116 L175 114 L200 117 L225 115 L250 111 L275 103 L300 100 L325 96 L350 97 L375 101 L400 104 L425 107 L450 113 L475 118 L500 121 L525 126 L550 133 L575 135 L600 137 L625 142 L650 138 L675 136 L700 128 L725 121 L750 118 L775 112 L800 112 L825 116 L850 115 L875 113 L900 121 L925 121 L950 120 L975 118 L1000 112 L1025 107 L1050 99 L1075 99 L1100 96 L1125 89 L1150 94 L1175 96 L1200 98 L1225 104 L1250 111 L1275 122 L1300 126 L1325 134 L1350 133 L1375 137 L1400 134 L1425 126 L1450 122 L1475 120 L1500 116 L1525 115 L1550 116 L1575 122 L1600 130 L1600 220Z",
	near: "M0 220 L0 186 L25 184 L50 180 L75 178 L100 176 L125 172 L150 170 L175 173 L200 168 L225 165 L250 168 L275 164 L300 166 L325 165 L350 168 L375 167 L400 172 L425 174 L450 172 L475 172 L500 171 L525 166 L550 170 L575 170 L600 168 L625 167 L650 172 L675 169 L700 169 L725 168 L750 166 L775 167 L800 164 L825 167 L850 165 L875 167 L900 165 L925 158 L950 156 L975 155 L1000 159 L1025 156 L1050 159 L1075 159 L1100 162 L1125 162 L1150 162 L1175 163 L1200 163 L1225 165 L1250 164 L1275 167 L1300 168 L1325 169 L1350 168 L1375 164 L1400 168 L1425 169 L1450 170 L1475 170 L1500 175 L1525 176 L1550 183 L1575 185 L1600 186 L1600 220Z",
};

/** A point on the water: `t` runs from the horizon (0) to the bottom edge (1). */
const onWater = (t: number) => `calc(var(--horizon) + (100% - var(--horizon)) * ${(t ** 1.5).toFixed(3)})`;

type Flower = "bloom" | "bud" | null;

// Lily pads in perspective: small, flat and hazy near the horizon; large and
// cropped by the frame up close. The lotus and the bud are the near ones.
const PADS: { x: number; t: number; flower?: Flower; bob: number }[] = [
	{ x: 6, t: 0.04, bob: 7 },
	{ x: 15, t: 0.09, bob: 8 },
	{ x: 29, t: 0.05, bob: 6.5 },
	{ x: 46, t: 0.03, bob: 7.5 },
	{ x: 54, t: 0.1, bob: 8.5 },
	{ x: 66, t: 0.06, bob: 7 },
	{ x: 79, t: 0.11, bob: 6 },
	{ x: 93, t: 0.05, bob: 8 },
	{ x: 4, t: 0.3, bob: 7.5 },
	{ x: 24, t: 0.22, bob: 6.5 },
	{ x: 38, t: 0.4, bob: 8 },
	{ x: 59, t: 0.33, bob: 7 },
	{ x: 76, t: 0.26, bob: 9 },
	{ x: 97, t: 0.42, bob: 7.5 },
	{ x: 31, t: 0.56, bob: 7 },
	{ x: 67, t: 0.74, bob: 8 },
	{ x: 85, t: 0.62, flower: "bud", bob: 6.5 },
	{ x: 17, t: 0.8, flower: "bloom", bob: 8 },
	{ x: 104, t: 0.9, bob: 9 },
	{ x: 52, t: 1.04, bob: 8.5 },
];
const BLOOM = PADS.find((p) => p.flower === "bloom")!;
const BUD = PADS.find((p) => p.flower === "bud")!;

const padStyle = ({ x, t }: { x: number; t: number }) => {
	const near = t ** 1.4;
	return {
		left: `${x}%`,
		top: onWater(t),
		width: `clamp(${Math.round(18 + 120 * t)}px, ${(2 + 17 * near).toFixed(1)}vw, ${Math.round(40 + 260 * t)}px)`,
		// Seen from above the water, distant pads flatten and fade into the haze.
		opacity: (0.5 + 0.5 * Math.min(1, t * 2.2)).toFixed(2),
		"--pad-squash": (0.45 + 0.55 * Math.min(1, t * 1.6)).toFixed(2),
	} as React.CSSProperties;
};

// Spots on the water that keep sending out rings, three per spot: around the
// lotus and the bud, and on open water where the petals land.
const RIPPLES = [
	{ x: BLOOM.x, t: BLOOM.t, size: 400, time: 10, opacity: 0.85 },
	{ x: BUD.x, t: BUD.t, size: 240, time: 8, opacity: 0.7 },
	{ x: 44, t: 0.72, size: 300, time: 12, opacity: 0.6 },
	{ x: 66, t: 0.5, size: 180, time: 9, opacity: 0.5 },
];

// The sun's path on the water: dashes that widen towards the viewer.
const SUN_X = 70;
const SUN_PATH = Array.from({ length: 9 }, (_, i) => {
	const t = (i + 0.6) / 10;
	return {
		left: `${SUN_X + (i % 2 ? 1.2 : -1.2) * t}%`,
		top: onWater(t * 0.8),
		width: `${(3 + 11 * t).toFixed(1)}vw`,
		time: 5 + (i % 3) * 1.5,
		delay: -i * 0.9,
	};
});

// Wind lines on the open water, longer towards the viewer.
const STREAKS = [
	{ x: 28, t: 0.18, w: 18 },
	{ x: 52, t: 0.3, w: 26 },
	{ x: 20, t: 0.46, w: 22 },
	{ x: 78, t: 0.5, w: 30 },
	{ x: 48, t: 0.66, w: 34 },
	{ x: 88, t: 0.84, w: 28 },
];

const BIRDS = [
	{ top: "13%", size: 20, time: 70, delay: -24, rest: "30vw" },
	{ top: "18%", size: 15, time: 86, delay: -50, rest: "58vw" },
	{ top: "22%", size: 12, time: 104, delay: -12, rest: "80vw" },
];

// Reed blades leaning out of the corners, drawn from their base at y=260.
const REEDS = [
	{ d: "M18 260 Q16 150 6 40 Q24 150 28 260 Z", time: 7 },
	{ d: "M34 260 Q40 140 58 20 Q48 150 44 260 Z", time: 9 },
	{ d: "M48 260 Q56 170 84 90 Q64 180 58 260 Z", time: 6.5 },
	{ d: "M8 260 Q2 190 -14 120 Q12 190 16 260 Z", time: 8 },
	{ d: "M60 260 Q74 200 110 160 Q80 210 70 260 Z", time: 7.5 },
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

function Lily({ flower }: { flower?: Flower }) {
	const rows = flower === "bloom" ? BLOOM_ROWS : flower === "bud" ? BUD_ROWS : [];
	return (
		<svg viewBox="0 0 200 120" className="w-full overflow-visible">
			<g className="pad">
				<path d={PAD_PATH} fill="url(#lotus-pond-pad)" />
				{PAD_VEINS.map((d) => (
					<path key={d} d={d} strokeWidth="1" style={{ stroke: "var(--pond-vein)" }} />
				))}
			</g>
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

function Ranges() {
	return (
		<svg viewBox="0 0 1600 220" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
			<path d={RANGES.far} style={{ fill: "var(--pond-range-far)" }} />
			<path d={RANGES.mid} style={{ fill: "var(--pond-range-mid)" }} />
			<path d={RANGES.near} style={{ fill: "var(--pond-range-near)" }} />
		</svg>
	);
}

function Reeds({ side }: { side: "left" | "right" }) {
	return (
		<svg viewBox="0 0 120 260" className={cn("reeds", side)}>
			{REEDS.map((blade) => (
				<path
					key={blade.d}
					d={blade.d}
					className="blade"
					style={{ animationDuration: `${blade.time}s`, fill: "var(--pond-reed)" }}
				/>
			))}
		</svg>
	);
}

/**
 * Backdrop of the login, error and not-found screens: dawn over the High
 * Atlas, a lotus pond in front. The sun rises behind the ranges and lays its
 * path on the water, pads drift in perspective, the lotus sends out rings,
 * petals tumble and birds cross the sky. Decorative only; a still scene
 * under reduced motion.
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

			{/* Sky: teal mist, the warm band above the horizon, the sun and its glow. */}
			<div className="sky" />
			<div
				className="dawn"
				style={{
					top: "-24%",
					left: "-18%",
					width: "70vmax",
					height: "70vmax",
					background: "radial-gradient(circle, var(--pond-mist), transparent 65%)",
				}}
			/>
			<div className="sun-glow" style={{ left: `${SUN_X}%` }} />
			<div className="sun" style={{ left: `${SUN_X}%` }} />
			{BIRDS.map((bird) => (
				<div
					key={bird.top}
					className="bird"
					style={
						{
							top: bird.top,
							animationDuration: `${bird.time}s`,
							animationDelay: `${bird.delay}s`,
							"--bird-rest": bird.rest,
						} as React.CSSProperties
					}
				>
					<svg width={bird.size} height={bird.size / 2} viewBox="0 0 20 10">
						<path d="M0 6 Q5 0 10 6 Q15 0 20 6" fill="none" strokeWidth="1.6" strokeLinecap="round" />
					</svg>
				</div>
			))}

			<div className="ranges">
				<Ranges />
			</div>
			<div className="haze" />

			{/* Water: the ranges mirrored, the sun's path, open-water rings. */}
			<div className="water" />
			<div className="reflection">
				<Ranges />
			</div>
			<div className="sun-reflection" style={{ left: `${SUN_X}%` }} />
			{STREAKS.map((streak) => (
				<span
					key={streak.t}
					className="streak"
					style={{ left: `${streak.x}%`, top: onWater(streak.t), width: `${streak.w}vw` }}
				/>
			))}
			{SUN_PATH.map((glint) => (
				<span
					key={glint.top}
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
								left: `${spot.x}%`,
								top: onWater(spot.t),
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

			{PADS.map((pad) => (
				<div key={`${pad.x}-${pad.t}`} className="lily" style={padStyle(pad)}>
					{pad.flower === "bloom" ? <span className="halo" /> : null}
					<div style={{ animationDuration: `${pad.bob}s` }}>
						<Lily flower={pad.flower} />
					</div>
				</div>
			))}

			<Reeds side="left" />
			<Reeds side="right" />

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
