// Shared chrome for /b2b/documents/[id] and /b2b/documents/new — both render
// a single, centered narrow column. The list page (/b2b/documents) lives
// outside this group so it stays full-width.
export default function DocumentDetailLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
			{children}
		</div>
	);
}
