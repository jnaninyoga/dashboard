"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TickCircle, ArrowLeft2, ArrowRight2, Refresh } from "iconsax-reactjs";

export interface WizardStep {
	id: string;
	title: string;
	description?: string;
}

interface FormWizardProps {
	steps: WizardStep[];
	currentStep: number;
	onNext: () => void;
	onBack: () => void;
	onSubmit: () => void;
	isSubmitting?: boolean;
	isStepPending?: boolean;
	canProceed?: boolean;
	children: React.ReactNode;
	submitLabel?: string;
	mode?: "create" | "edit";
}

export function FormWizard({
	steps,
	currentStep,
	onNext,
	onBack,
	onSubmit,
	isSubmitting = false,
	isStepPending = false,
	canProceed = true,
	children,
	submitLabel = "Create Profile",
	mode = "create",
}: FormWizardProps) {
	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === steps.length - 1;

	return (
		<div className="space-y-8">
			{/* Progress Indicator */}
			<div className="relative">
				{/* Progress Line */}
				<div className="absolute top-5 left-0 right-0 h-0.5 bg-secondary-foreground/20">
					<div
						className="h-full bg-primary transition-all duration-300 ease-in-out"
						style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
					/>
				</div>

				{/* Step Indicators */}
				<div className="relative flex justify-between">
					{steps.map((step, index) => {
						const isCompleted = index < currentStep;
						const isCurrent = index === currentStep;

						return (
							<div key={step.id} className="flex flex-col items-center">
								<div className="relative">
									{isCurrent && (
										<span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
									)}
									<div
										className={cn(
											"relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
											isCompleted && "bg-primary text-primary-foreground",
											isCurrent && "bg-primary text-primary-foreground scale-110",
											!isCompleted && !isCurrent && "border-2 border-secondary-foreground/30 bg-background text-secondary-foreground/60",
										)}
									>
										{isCompleted ? (
											<TickCircle className="h-5 w-5" variant="Bold" />
										) : (
											<span className="text-sm font-semibold">
												{index + 1}
											</span>
										)}
									</div>
								</div>

								{/* Label */}
								<div className="mt-2 text-center">
									<p
										className={cn(
											"text-sm font-medium",
											isCurrent && "text-foreground",
											!isCurrent && "text-muted-foreground",
										)}
									>
										{step.title}
									</p>
									{step.description && (
										<p className="text-xs text-muted-foreground hidden sm:block">
											{step.description}
										</p>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Step Content */}
			<div className="min-h-[400px]">{children}</div>

			{/* Navigation Buttons */}
			<div className="flex justify-between pt-6 border-t">
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					disabled={isFirstStep || isSubmitting || isStepPending}
				>
					<ArrowLeft2 className="mr-2 h-4 w-4" variant="Outline" />
					Back
				</Button>

				{isLastStep ? (
					<Button
						key="submit-step-btn"
						type="submit"
						disabled={isSubmitting || !canProceed || isStepPending}
					>
						{isSubmitting ? (
							<>
								<Refresh className="mr-2 h-4 w-4 animate-spin" variant="Outline" />
								{mode === "create" ? "Creating..." : "Updating..."}
							</>
						) : (
							submitLabel
						)}
					</Button>
				) : (
					<Button
						key="next-step-btn"
						type="button"
						onClick={onNext}
						disabled={!canProceed || isSubmitting || isStepPending}
					>
						{isStepPending ? (
							<>
								<Refresh className="mr-2 h-4 w-4 animate-spin" variant="Outline" />
								Validating...
							</>
						) : (
							<>
								Next
								<ArrowRight2 className="ml-2 h-4 w-4" variant="Outline" />
							</>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
