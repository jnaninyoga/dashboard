"use client";

import { useTransition, useState, useEffect } from "react";
import { createClientAction, updateClientAction } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { HEALTH_TEMPLATE, type HealthSection } from "@/config/health";
import { FormWizard, type WizardStep } from "@/components/form-wizard";
import { clientSchema, type ClientFormValues } from "@/lib/validators";

// Import Refactored Steps
import { StepPersonalDetails } from "@/components/clients/forms/step-personal-details";
import { StepHealthWellness } from "@/components/clients/forms/step-health-wellness";
import { StepConsultation } from "@/components/clients/forms/step-consultation";
import { StepMembership } from "@/components/clients/forms/step-membership";
import { ClientCategory } from "@/lib/types";

const WIZARD_STEPS: WizardStep[] = [
	{ id: "personal", title: "Personal Info", description: "Identity & Contact" },
	{ id: "health", title: "Health History", description: "Medical Background" },
	{
		id: "wellness",
		title: "Wellness",
		description: "Lifestyle & Mental Health",
	},
	{ id: "membership", title: "Membership", description: "Select Plan" },
	{ id: "consultation", title: "Consultation", description: "Notes & Submit" },
];

const getHealthSectionsByStep = (step: number): HealthSection[] => {
	switch (step) {
		case 1:
			return HEALTH_TEMPLATE.filter(
				(s) => s.category === "physical" || s.category === "medical_history",
			);
		case 2:
			return HEALTH_TEMPLATE.filter(
				(s) => s.category === "mental" || s.category === "lifestyle",
			);
		default:
			return [];
	}
};

interface ClientFormProps {
	initialData?: Partial<ClientFormValues> & { id?: string };
	mode: "create" | "edit";
}

export function ClientForm({ initialData, mode }: ClientFormProps) {
	const [isPending, startTransition] = useTransition();
	const [serverError, setServerError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [isStepPending, setIsStepPending] = useState(false);
	const router = useRouter();
	const STORAGE_KEY = `client-form-progress-${mode}-${initialData?.id || "new"}`;

	const form = useForm<ClientFormValues>({
		resolver: zodResolver(clientSchema),
		shouldUnregister: false,
		defaultValues: {
			fullName: "",
			email: "",
			phone: "",
			address: "",
			profession: "",
			birthDate: "",
			category: ClientCategory.ADULT,
			consultationReason: "",
			intakeData: {},
			...initialData,
			// Ensure enums are set or undefined, not null
			gender: initialData?.gender || undefined,
			referralSource: initialData?.referralSource || undefined,
            // Map active product to initialProductId for Edit mode display
            // @ts-ignore - dynamic prop from getClientById
            initialProductId: initialData?.activeProductId || undefined,
            // Map existing healthLogs if any (for Edit mode)
            // @ts-ignore - dynamic prop
            healthLogs: initialData?.healthLogs || [],
		},
	});

	// Load saved progress on mount (only for create mode usually, or if we want draft edits)
	// For Edit mode, we rely on initialData mainly.
	// Let's only use local storage for "create" to avoid overwriting DB data with stale local data
	useEffect(() => {
		if (mode === "edit") return;

		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const { values, step } = JSON.parse(saved);
				if (values) {
					form.reset({ ...form.getValues(), ...values });
				}
				if (typeof step === "number") {
					setCurrentStep(step);
				}
			} catch (e) {
				console.error("Failed to load saved form progress:", e);
			}
		}
	}, [form, mode, STORAGE_KEY]);

	// Save progress
	useEffect(() => {
		if (mode === "edit") return;

		const subscription = form.watch((values) => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					values,
					step: currentStep,
				}),
			);
		});

		return () => subscription.unsubscribe();
	}, [form, currentStep, mode, STORAGE_KEY]);

	const getStepFields = (step: number): (keyof ClientFormValues)[] => {
		switch (step) {
			case 0:
				return ["fullName", "phone", "birthDate", "category", "gender"];
			case 1:
				return []; // flexible intake data
			case 2:
				return []; // flexible intake data
			case 3:
				return []; // membership selection
			case 4:
				return ["consultationReason"];
			default:
				return [];
		}
	};

	const handleNext = async () => {
		setIsStepPending(true);
		try {
			const fieldsToValidate = getStepFields(currentStep);
			if (fieldsToValidate.length > 0) {
				const isValid = await form.trigger(fieldsToValidate);
				if (!isValid) {
					setServerError("Please fix the errors in the current step before proceeding.");
					return;
				}
			}
			setServerError(null); // Clear error if moving forward
			if (currentStep < WIZARD_STEPS.length - 1) {
				setCurrentStep((prev) => prev + 1);
			}
		} finally {
			setIsStepPending(false);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	function onSubmit(values: ClientFormValues) {
		if (currentStep !== WIZARD_STEPS.length - 1) {
			handleNext();
			return;
		}

		setServerError(null);
		startTransition(async () => {
			const formData = new FormData();

			formData.append("fullName", values.fullName);
			formData.append("phone", values.phone);
			if (values.email) formData.append("email", values.email);
			if (values.address) formData.append("address", values.address);
			if (values.profession) formData.append("profession", values.profession);
			formData.append("birthDate", values.birthDate || "");
			formData.append("category", values.category || ClientCategory.ADULT.toString());
			if (values.gender) formData.append("gender", values.gender);
			if (values.referralSource)
				formData.append("referralSource", values.referralSource);
			if (values.consultationReason)
				formData.append("consultationReason", values.consultationReason);
            
            // @ts-ignore - Validated by wizard state but not in main schema yet
            if (values.initialProductId) {
                // @ts-ignore
                formData.append("initialProductId", values.initialProductId);
            }

			if (values.intakeData) {
				Object.entries(values.intakeData).forEach(([key, val]) => {
					if (val) formData.append(key, val);
				});
			}

			let result;
			if (mode === "edit" && initialData?.id) {
				result = await updateClientAction(initialData.id, null, formData);
			} else {
				result = await createClientAction(null, formData);
			}

			if (result?.error) {
				if (result.issues) {
					// Map Zod issues to form errors
					let hasFieldErrors = false;
					Object.entries(result.issues).forEach(([key, value]: [string, any]) => {
						if (key === "_errors") return;
						if (value && value._errors && Array.isArray(value._errors)) {
							form.setError(key as keyof ClientFormValues, {
								message: value._errors.join(", "),
							});
							hasFieldErrors = true;
						}
					});
					
					if (hasFieldErrors) {
						setServerError("Please fix the highlighted errors.");
					} else {
						setServerError(result.error);
					}
				} else {
					setServerError(result.error);
				}
			} else {
				if (mode === "create") localStorage.removeItem(STORAGE_KEY);
				router.push("/clients");
			}
		});
	}

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">
					{mode === "create" ? "Add New Client" : "Edit Client"}
				</h2>
				<div className="flex items-center space-x-2">
					<Button variant="outline" onClick={() => router.push("/clients")}>
						Cancel
					</Button>
				</div>
			</div>

			{serverError && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{serverError}</AlertDescription>
				</Alert>
			)}

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormWizard
						steps={WIZARD_STEPS}
						currentStep={currentStep}
						onNext={handleNext}
						onBack={handleBack}
						onSubmit={form.handleSubmit(onSubmit)}
						isSubmitting={isPending}
						isStepPending={isStepPending}
						submitLabel={mode === "create" ? "Create Client" : "Update Client"}
						mode={mode}
					>
						{currentStep === 0 && <StepPersonalDetails form={form} />}
						{currentStep === 1 && (
							<StepHealthWellness
								form={form}
								sections={getHealthSectionsByStep(1)}
							/>
						)}
						{currentStep === 2 && (
							<StepHealthWellness
								form={form}
								sections={getHealthSectionsByStep(2)}
							/>
						)}
						{currentStep === 3 && (
                            <StepMembership form={form} />
                        )}
						{currentStep === 4 && <StepConsultation form={form} />}
					</FormWizard>
				</form>
			</Form>
		</div>
	);
}
