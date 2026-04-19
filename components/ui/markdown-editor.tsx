"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
	Edit2,
	Eye,
	Link,
	Text as TextIcon,
	TextalignLeft,
	TextBold,
	TextItalic,
} from "iconsax-reactjs";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
}

export function MarkdownEditor({
	className,
	label,
	value,
	onChange,
	defaultValue,
	placeholder,
	...props
}: MarkdownEditorProps) {
	const [isEditing, setIsEditing] = React.useState(true);
	const [content, setContent] = React.useState(
		(value as string) || (defaultValue as string) || "",
	);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);

	// Sync local state with prop value if controlled
	React.useEffect(() => {
		if (value !== undefined) {
			setContent(value as string);
		}
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newVal = e.target.value;
		setContent(newVal);
		if (onChange) {
			onChange(e);
		}
	};

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

		// Set value directly and trigger change
		textarea.value = newText;
		setContent(newText);

		// Manually trigger the onChange event for the parent form
		const event = {
			target: textarea,
			currentTarget: textarea,
		} as React.ChangeEvent<HTMLTextAreaElement>;

		if (onChange) {
			onChange(event);
		}

		textarea.focus();
		textarea.setSelectionRange(start + prefix.length, end + prefix.length);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if ((e.ctrlKey || e.metaKey) && isEditing) {
			if (e.key === "b") {
				e.preventDefault();
				insertMarkdown("**", "**");
			} else if (e.key === "i") {
				e.preventDefault();
				insertMarkdown("_", "_");
			} else if (e.key === "p") {
				e.preventDefault();
				setIsEditing(!isEditing);
			}
		}
	};

	return (
		<div className={cn("group/editor w-full space-y-2.5", className)}>
			{label ? (
				<Label className="text-muted-foreground/60 ml-1 text-[10px] font-black uppercase tracking-widest">
					{label}
				</Label>
			) : null}

			<div className="bg-card/40 border-secondary-2/70 focus-within:border-secondary-2 focus-within:ring-secondary-2 flex flex-col overflow-hidden rounded-3xl border backdrop-blur-sm transition-all duration-300 focus-within:ring-2">
				{/* Enhanced Toolbar */}
				<div className="border-secondary/10 bg-secondary/60 flex items-center gap-1 border-b p-2 backdrop-blur-md">
					{/* Actions (Only disabled in preview mode visually, but buttons remain) */}
					<div
						className={cn(
							"flex items-center gap-1 transition-opacity duration-300",
							!isEditing && "pointer-events-none opacity-60",
						)}
					>
						<ToolbarButton
							onClick={() => insertMarkdown("**", "**")}
							icon={<TextBold size={18} variant="Outline" />}
							label="Bold (Ctrl+B)"
						/>
						<ToolbarButton
							onClick={() => insertMarkdown("_", "_")}
							icon={<TextItalic size={18} variant="Outline" />}
							label="Italic (Ctrl+I)"
						/>
						<div className="bg-secondary-3 mx-1 h-4 w-px" />
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
						<div className="bg-secondary-3 mx-1 h-4 w-px" />
						<ToolbarButton
							onClick={() => insertMarkdown("[", "](url)")}
							icon={<Link size={18} variant="Outline" />}
							label="Link"
						/>
					</div>

					<div className="flex-1" />

					<div className="bg-background/20 flex gap-0.5 rounded-xl p-0.5">
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className={cn(
								"flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider transition-all",
								isEditing
									? "bg-primary/10 text-primary"
									: "text-secondary-foreground/80 hover:text-secondary-foreground",
							)}
						>
							<Edit2 size={14} variant={isEditing ? "Bold" : "Outline"} />
							Write
						</button>
						<button
							type="button"
							onClick={() => setIsEditing(false)}
							className={cn(
								"flex h-8 items-center gap-2 rounded-lg px-3 text-[10px] font-bold uppercase tracking-wider transition-all",
								!isEditing
									? "bg-primary/10 text-primary"
									: "text-secondary-foreground/80 hover:text-secondary-foreground",
							)}
						>
							<Eye size={14} variant={!isEditing ? "Bold" : "Outline"} />
							Preview
						</button>
					</div>
				</div>

				<div className="relative min-h-[160px]">
					{isEditing ? (
						<Textarea
							{...props}
							ref={textareaRef}
							value={content}
							onChange={handleChange}
							onKeyDown={handleKeyDown}
							placeholder={placeholder}
							className="text-foreground placeholder:text-muted-foreground/30 min-h-[160px] w-full resize-y border-none bg-transparent px-6 py-5 font-mono text-sm leading-relaxed transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
						/>
					) : (
						<div className="animate-in fade-in slide-in-from-bottom-1 p-8 duration-300">
							<div className="prose prose-sm prose-invert max-w-none">
								{content ? (
									<div className="text-secondary-foreground space-y-4">
										<ReactMarkdown
											remarkPlugins={[remarkGfm]}
											components={{
												p: ({ children }: any) => (
													<p className="text-sm leading-relaxed opacity-90">
														{children}
													</p>
												),
												strong: ({ children }: any) => (
													<strong className="text-primary font-bold">
														{children}
													</strong>
												),
												em: ({ children }: any) => (
													<em className="font-italic text-secondary-3">
														{children}
													</em>
												),
												h3: ({ children }: any) => (
													<h3 className="font-heading mb-4 text-lg font-bold tracking-tight text-foreground">
														{children}
													</h3>
												),
												ul: ({ children }: any) => (
													<ul className="ml-4 list-disc space-y-2 text-sm opacity-80">
														{children}
													</ul>
												),
												li: ({ children, checked }: any) => {
													if (checked !== null && checked !== undefined) {
														return (
															<li className="flex items-start gap-3 py-1.5 list-none">
																<Checkbox
																	checked={checked}
																	className="mt-0.5"
																	disabled
																/>
																<span
																	className={cn(
																		"text-sm leading-none",
																		checked &&
																			"text-muted-foreground line-through",
																	)}
																>
																	{children}
																</span>
															</li>
														);
													}
													return <li className="pl-1 text-sm">{children}</li>;
												},
												table: ({ children }: any) => (
													<Table containerClassName="my-6">{children}</Table>
												),
												thead: ({ children }: any) => (
													<TableHeader>{children}</TableHeader>
												),
												tbody: ({ children }: any) => (
													<TableBody>{children}</TableBody>
												),
												tr: ({ children }: any) => (
													<TableRow>{children}</TableRow>
												),
												th: ({ children }: any) => (
													<TableHead className="font-black">
														{children}
													</TableHead>
												),
												td: ({ children }: any) => (
													<TableCell className="opacity-90">
														{children}
													</TableCell>
												),
												a: ({ children, href }: any) => (
													<a
														href={href}
														target="_blank"
														rel="noopener noreferrer"
														className="text-primary underline-offset-4 hover:underline"
													>
														{children}
													</a>
												),
												blockquote: ({ children }: any) => (
													<blockquote className="border-primary/30 bg-primary/5 rounded-r-xl border-l-4 py-2 pl-4 pr-3 italic opacity-90 transition-all hover:bg-primary/10">
														{children}
													</blockquote>
												),
												hr: () => <Separator className="my-6" />,
												del: ({ children }: any) => (
													<del className="text-secondary-foreground/50 line-through">
														{children}
													</del>
												),
												code: ({
													node,
													className,
													children,
													...props
												}: any) => {
													const match = /language-(\w+)/.exec(className || "");
													const isCodeBlock = !!match;

													return !isCodeBlock ? (
														<Badge
															variant="secondary"
															className="bg-primary/10 text-primary border-primary/10 relative -top-px mx-1 inline-flex h-5 font-mono text-[10px] font-bold"
														>
															{children}
														</Badge>
													) : (
														<code
															className={cn(
																"bg-primary/10 text-primary border-primary/10 block w-full overflow-x-auto rounded-xl p-4 font-mono text-sm",
																className,
															)}
															{...props}
														>
															{children}
														</code>
													);
												},
											}}
										>
											{content}
										</ReactMarkdown>
									</div>
								) : (
									<p className="text-muted-foreground/40 italic">
										{placeholder || "Nothing to preview yet..."}
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function ToolbarButton({
	onClick,
	icon,
	label,
}: {
	onClick: () => void;
	icon: React.ReactNode;
	label: string;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			className="text-secondary-foreground hover:bg-primary/10 hover:text-primary h-9 w-9 rounded-xl transition-all duration-200"
			onClick={onClick}
			title={label}
		>
			{icon}
		</Button>
	);
}
