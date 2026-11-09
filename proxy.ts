import { type NextRequest, NextResponse } from "next/server";

import { hasAccess, NOT_ALLOWED } from "@/lib/auth/allowlist";
import { auth } from "@/lib/auth/auth";

function isPublicRoute(path: string) {
	return (
		path === "/login" ||
		path.startsWith("/api/auth/") ||
		// PWA files must load signed out too, or install/offline breaks on /login
		path === "/manifest.webmanifest" ||
		path.startsWith("/serwist/") ||
		// Component playground, only under `next dev` (the page itself 404s elsewhere)
		(process.env.NODE_ENV === "development" && path.startsWith("/dev/"))
	);
}

export async function proxy(request: NextRequest) {
	const path = request.nextUrl.pathname;
	const response = NextResponse.next();

	// Prevent indexing via header (belt-and-suspenders approach)
	response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");

	if (isPublicRoute(path)) return response;

	// Checked against the database rather than just the cookie: this is the
	// one place a renewed session can reach the browser, since a Server
	// Component can't set cookies.
	let result;
	try {
		result = await auth.api.getSession({ headers: request.headers, returnHeaders: true });
	} catch (error) {
		// A database outage isn't a sign-out. The page's own check fails too
		// and lands on the error screen, with a code she can report.
		console.error("Proxy couldn't check the session:", error);
		return response;
	}

	const { headers: authHeaders, response: session } = result;

	if (!session || !hasAccess(session.user)) {
		const url = request.nextUrl.clone();
		url.pathname = "/login";
		url.searchParams.set("next", path);
		if (session) url.searchParams.set("error", NOT_ALLOWED);
		return NextResponse.redirect(url);
	}

	for (const cookie of authHeaders.getSetCookie()) {
		response.headers.append("set-cookie", cookie);
	}

	return response;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
		 * Feel free to modify this pattern to include more paths.
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
