"use client";

import { cn } from "@/lib/utils/ui";

type PatternProps = { className?: string };

// Shared SVG shell so every pattern has the same viewBox / stroke language.
function Shell({ children, className }: { children: React.ReactNode } & PatternProps) {
    return (
        <svg
            viewBox="0 0 240 240"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={cn("h-full w-full", className)}
        >
            {children}
        </svg>
    );
}

// Group → Flower of Life. Seven interlocking circles = community, gathering.
export function MandalaPattern({ className }: PatternProps) {
    const ring = [
        [120, 75],
        [159, 97.5],
        [159, 142.5],
        [120, 165],
        [81, 142.5],
        [81, 97.5],
    ] as const;
    return (
        <Shell className={className}>
            <circle cx="120" cy="120" r="115" opacity="0.5" />
            <circle cx="120" cy="120" r="100" strokeDasharray="1 4" />
            <circle cx="120" cy="120" r="45" />
            {ring.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="45" />
            ))}
            <circle cx="120" cy="120" r="22" />
            <circle cx="120" cy="120" r="8" />
        </Shell>
    );
}

// Private → Eight-petal lotus. Single bloom = solitary focus, one-on-one.
export function LotusPattern({ className }: PatternProps) {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
        <Shell className={className}>
            <circle cx="120" cy="120" r="115" opacity="0.5" strokeDasharray="1 4" />
            <circle cx="120" cy="120" r="90" opacity="0.4" />
            <g transform="translate(120 120)">
                {angles.map((deg) => (
                    <ellipse key={deg} cx="0" cy="-55" rx="16" ry="55" transform={`rotate(${deg})`} />
                ))}
                {angles.map((deg) => (
                    <ellipse
                        key={`inner-${deg}`}
                        cx="0"
                        cy="-30"
                        rx="8"
                        ry="28"
                        transform={`rotate(${deg + 22.5})`}
                    />
                ))}
            </g>
            <circle cx="120" cy="120" r="14" />
            <circle cx="120" cy="120" r="5" />
        </Shell>
    );
}

// B2B → Honeycomb flower (7 hexes). Interlocking structure = partnerships.
export function HexPattern({ className }: PatternProps) {
    const centers = [
        [120, 120],
        [172, 120],
        [146, 75],
        [94, 75],
        [68, 120],
        [94, 165],
        [146, 165],
    ] as const;
    const hex = "0,-30 -26,-15 -26,15 0,30 26,15 26,-15";
    return (
        <Shell className={className}>
            <circle cx="120" cy="120" r="115" opacity="0.35" strokeDasharray="1 4" />
            {centers.map(([x, y]) => (
                <polygon key={`${x}-${y}`} points={hex} transform={`translate(${x} ${y})`} />
            ))}
            <polygon points="0,-12 -10,-6 -10,6 0,12 10,6 10,-6" transform="translate(120 120)" />
            <circle cx="120" cy="120" r="3" fill="currentColor" stroke="none" />
        </Shell>
    );
}

// Outdoor → Sun with 16 rays. Openness, daylight, outside the studio walls.
export function SunPattern({ className }: PatternProps) {
    const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
    return (
        <Shell className={className}>
            <circle cx="120" cy="120" r="115" opacity="0.4" strokeDasharray="1 4" />
            <circle cx="120" cy="120" r="42" />
            <circle cx="120" cy="120" r="56" opacity="0.5" />
            <g transform="translate(120 120)">
                {rays.map((deg) => (
                    <line key={deg} x1="0" y1="-68" x2="0" y2="-100" transform={`rotate(${deg})`} />
                ))}
            </g>
            <circle cx="120" cy="120" r="18" />
            <circle cx="120" cy="120" r="6" fill="currentColor" stroke="none" />
        </Shell>
    );
}
