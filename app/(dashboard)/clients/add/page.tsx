"use client";

import { useTransition, useState, useEffect } from "react";
import { createClientAction } from "@/actions/clients";
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

// Wizard steps configuration
const WIZARD_STEPS: WizardStep[] = [
	{ id: "personal", title: "Personal Info", description: "Identity & Contact" },
	{ id: "health", title: "Health History", description: "Medical Background" },
	{
		id: "wellness",
		title: "Wellness",
		description: "Lifestyle & Mental Health",
	},
	{ id: "consultation", title: "Consultation", description: "Notes & Submit" },
];

// Group health sections by wizard step
const getHealthSectionsByStep = (step: number): HealthSection[] => {
	switch (step) {
		case 1: // Health History
			return HEALTH_TEMPLATE.filter(
				(s) => s.category === "physical" || s.category === "medical_history",
			);
		case 2: // Wellness Profile
			return HEALTH_TEMPLATE.filter(
				(s) => s.category === "mental" || s.category === "lifestyle",
			);
		default:
			return [];
	}
};

export default function AddClientPage() {
	const [isPending, startTransition] = useTransition();
	const [serverError, setServerError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState(0);
	const router = useRouter();
	const STORAGE_KEY = "client-form-progress";

	const form = useForm<ClientFormValues>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			fullName: "",
			email: "",
			phone: "",
			address: "",
			profession: "",
			birthDate: "",
			category: "adult",
			gender: undefined,
			referralSource: undefined,
			consultationReason: "",
			intakeData: {},
		},
	});

	// Load saved progress on mount
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const { values, step } = JSON.parse(saved);
				if (values) {
					// Reset form with saved values, merging with defaults
					form.reset({ ...form.getValues(), ...values });
				}
				if (typeof step === "number") {
					setCurrentStep(step);
				}
			} catch (e) {
				console.error("Failed to load saved form progress:", e);
			}
		}
	}, [form]);

	// Save progress on form changes or step changes
	useEffect(() => {
		const subscription = form.watch((values) => {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					values,
					step: currentStep,
				}),
			);
		});

		// Also save when step changes explicitly (in case form didn't change)
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				values: form.getValues(),
				step: currentStep,
			}),
		);

		return () => subscription.unsubscribe();
	}, [form, currentStep]);

	// Define which fields to validate for each step
	const getStepFields = (step: number): (keyof ClientFormValues)[] => {
		switch (step) {
			case 0: // Personal Info - required fields
				return ["fullName", "phone", "birthDate", "category"];
			case 1: // Health History - optional
				return [];
			case 2: // Wellness - optional
				return [];
			case 3: // Consultation - optional
				return [];
			default:
				return [];
		}
	};

	const handleNext = async () => {
		const fieldsToValidate = getStepFields(currentStep);

		if (fieldsToValidate.length > 0) {
			// Trigger validation for step fields
			const isValid = await form.trigger(fieldsToValidate);
			if (!isValid) return; // Don't proceed if validation fails
		}

		if (currentStep < WIZARD_STEPS.length - 1) {
			setCurrentStep((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		}
	};

	function onSubmit(values: ClientFormValues) {
		// Prevent premature submission if not on the last step (e.g. via Enter key)
		if (currentStep !== WIZARD_STEPS.length - 1) {
			handleNext();
			return;
		}

		setServerError(null);
		startTransition(async () => {
			const formData = new FormData();

			// Top level fields
			formData.append("fullName", values.fullName);
			formData.append("phone", values.phone);
			if (values.email) formData.append("email", values.email);
			if (values.address) formData.append("address", values.address);
			if (values.profession) formData.append("profession", values.profession);
			formData.append("birthDate", values.birthDate || "");
			formData.append("category", values.category || "adult");
			if (values.gender) formData.append("gender", values.gender);
			if (values.referralSource)
				formData.append("referralSource", values.referralSource);
			if (values.consultationReason)
				formData.append("consultationReason", values.consultationReason);

			// Intake Data Mapping
			if (values.intakeData) {
				Object.entries(values.intakeData).forEach(([key, val]) => {
					if (val) formData.append(key, val);
				});
			}

			const result = await createClientAction(null, formData);

			if (result?.error) {
				setServerError(result.error);
			} else {
				localStorage.removeItem(STORAGE_KEY);
				router.push("/clients");
			}
		});
	}

	return (
		<div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">Add New Client</h2>
				<div className="flex items-center space-x-2">
					<Button variant="outline" onClick={() => window.history.back()}>
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
					>
						{/* Step 1: Personal Information */}
						{currentStep === 0 && <StepPersonalDetails form={form} />}

						{/* Step 2: Health History */}
						{currentStep === 1 && (
							<StepHealthWellness
								form={form}
								sections={getHealthSectionsByStep(1)}
							/>
						)}

						{/* Step 3: Wellness Profile */}
						{currentStep === 2 && (
							<StepHealthWellness
								form={form}
								sections={getHealthSectionsByStep(2)}
							/>
						)}

						{/* Step 4: Consultation */}
						{currentStep === 3 && <StepConsultation form={form} />}
					</FormWizard>
				</form>
			</Form>
		</div>
	);
}
