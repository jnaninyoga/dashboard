"use client";

import { DocumentText } from "iconsax-reactjs";

type DocumentNotFoundProps = {
    title?: string;
    message?: string;
}

export default function DocumentNotFound({ title, message }: DocumentNotFoundProps) {
    return (
        <div className="group border-foreground/10 bg-card/80 hover:bg-card flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-20 text-center transition-all">
            <div className="border-primary/15 bg-primary/10 mb-4 rounded-2xl border p-6 shadow-sm transition-colors zen-glow-teal">
                <DocumentText
                    className="text-primary/80 size-10 group-hover:text-primary transition-colors"
                    variant="Bulk"
                />
            </div>
            <h3 className="font-heading text-foreground text-xl font-bold">
                {title || "No documents"}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-lg text-sm">
                {message || "Quotes and invoices will appear here once generated. Try adjusting your filters or search query."}
            </p>
		</div>
    );
}