import { notFound } from "next/navigation";

import { Playground } from "./playground";

// Component playground for checking UI primitives without signing in.
// Development only: the proxy lets /dev/* through only under `next dev`,
// and this page 404s in any other build.
export default function PlaygroundPage() {
	if (process.env.NODE_ENV !== "development") notFound();
	return <Playground />;
}
