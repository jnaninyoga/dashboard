"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { 
    Link, 
    Text as TextIcon, 
    TextalignLeft,
    TextBold, 
    TextItalic, 
} from "iconsax-reactjs";

interface MarkdownEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export function MarkdownEditor({ className, label, ...props }: MarkdownEditorProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const insertMarkdown = (prefix: string, suffix: string = "") => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        const beforeText = text.substring(0, start);
        const afterText = text.substring(end);

        const newText = `${beforeText}${prefix}${selectedText}${suffix}${afterText}`;
        
        textarea.value = newText;
        
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);

        textarea.focus();
        textarea.setSelectionRange(
            start + prefix.length,
            end + prefix.length
        );
    };

    return (
        <div className={cn("space-y-2 w-full", className)}>
            {label ? <Label className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60 ml-1">{label}</Label> : null}
            <div className="flex flex-col rounded-3xl border border-secondary/20 bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/30 shadow-sm group">
                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b border-secondary/10 bg-muted/40 backdrop-blur-md">
                    <ToolbarButton 
                        onClick={() => insertMarkdown("**", "**")} 
                        icon={<TextBold size={18} variant="Outline" />} 
                        label="Bold"
                    />
                    <ToolbarButton 
                        onClick={() => insertMarkdown("_", "_")} 
                        icon={<TextItalic size={18} variant="Outline" />} 
                        label="Italic"
                    />
                    <div className="w-px h-4 bg-secondary/20 mx-1" />
                    <ToolbarButton 
                        onClick={() => insertMarkdown("### ")} 
                        icon={<TextIcon size={18} variant="Outline" />} 
                        label="Heading"
                    />
                    <ToolbarButton 
                        onClick={() => insertMarkdown("- ")} 
                        icon={<TextalignLeft size={18} variant="Outline" />} 
                        label="Bullet List"
                    />
                    <div className="w-px h-4 bg-secondary/20 mx-1" />
                    <ToolbarButton 
                        onClick={() => insertMarkdown("[", "](url)")} 
                        icon={<Link size={18} variant="Outline" />} 
                        label="Link"
                    />
                    <div className="flex-1" />
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase text-primary/40 px-3 select-none group-focus-within:text-primary/60 transition-colors">Markdown</span>
                </div>

                <Textarea
                    {...props}
                    ref={textareaRef}
                    className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none bg-transparent min-h-[140px] resize-y px-6 py-4 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 transition-all"
                />
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary text-muted-foreground/60 transition-all duration-200"
            onClick={onClick}
            title={label}
        >
            {icon}
        </Button>
    );
}
