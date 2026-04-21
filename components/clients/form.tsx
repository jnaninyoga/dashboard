"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { StepConsultation } from "@/components/clients/forms/consultation";
import { StepHealthWellness } from "@/components/clients/forms/health-wellness";
import { StepMembership } from "@/components/clients/forms/membership";
import { StepPersonalDetails } from "@/components/clients/forms/personal-details";
import { FormWizard, type WizardStep } from "@/components/form-wizard";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createClientAction, updateClientAction } from "@/lib/actions/clients/mutations";
import { HEALTH_TEMPLATE, type HealthSection } from "@/lib/config/health";
import { 
    type Category, 
    type HealthLog 
} from "@/lib/types";
import { type ClientFormValues, clientSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const WIZARD_STEPS: WizardStep[] = [
	{ id: "personal", title: "Personal Info", description: "Identity & Contact" },
	{
		id: "health",
		title: "Health & Wellness",
		description: "Medical & Lifestyle",
	},
	{ id: "membership", title: "Membership", description: "Select Plan" },
	{ id: "consultation", title: "Consultation", description: "Notes & Submit" },
];

const getHealthSectionsByStep = (step: number): HealthSection[] => {
	switch (step) {
		case 1:
			return HEALTH_TEMPLATE;
		default:
			return [];
	}
};

interface ClientFormProps {
	initialData?: Partial<ClientFormValues> & { 
		id?: string;
		activeProductId?: string;
		healthLogs?: HealthLog[];
	};
	mode: "create" | "edit";
    categories: Category[];
}

export function ClientForm({ initialData, mode, categories }: ClientFormProps) {
	const router = useRouter();
	const STORAGE_KEY = `client-form-progress-${mode}-${initialData?.id || "new"}`;

    const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
        if (mode === "edit" && initialData?.id) {
            return await updateClientAction(initialData.id, null, formData);
        } else {
            return await createClientAction(null, formData);
        }
    }, null);

	// Load saved progress safely for initial state
	const getSavedProgress = () => {
		if (typeof window === "undefined") return null;
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return null;
		try {
			return JSON.parse(saved);
		} catch (e) {
			console.error("Failed to parse saved form progress:", e);
			return null;
		}
	};

	const savedProgress = getSavedProgress();

	const [currentStep, setCurrentStep] = useState(() => {
		if (savedProgress && typeof savedProgress.step === "number" && mode === "create") {
			return savedProgress.step;
		}
		return 0;
	});

	const [isStepPending, setIsStepPending] = useState(false);

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
			categoryId: "",
			consultationReason: "",
			intakeData: {},
			...initialData,
			// Apply saved values if any
			...(savedProgress?.values || {}),
			// Ensure enums are set or undefined, not null
			gender: initialData?.gender || savedProgress?.values?.gender || undefined,
			referralSource:
				initialData?.referralSource ||
				savedProgress?.values?.referralSource ||
				undefined,
			// Map active product to initialProductId for Edit mode display
			initialProductId:
				initialData?.activeProductId ||
				savedProgress?.values?.initialProductId ||
				undefined,
			// Map existing healthLogs if any (for Edit mode)
			healthLogs: initialData?.healthLogs || savedProgress?.values?.healthLogs || [],
		},
	});


	const watchedValues = useWatch({ control: form.control });

	// Save progress
	useEffect(() => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				values: watchedValues,
				step: currentStep,
			}),
		);
	}, [watchedValues, currentStep, STORAGE_KEY]);


    // Handle server state
    useEffect(() => {
        if (state?.success) {
            toast.success(mode === "create" ? "Client created successfully!" : "Client updated successfully!");
            localStorage.removeItem(STORAGE_KEY);
            router.push("/clients");
        } else if (state?.error) {
            if (state.issues) {
                // Map Zod issues to form errors
                Object.entries(state.issues).forEach(([key, value]) => {
                    if (key === "_errors") return;
                    const val = value as { _errors?: string[] };
                    if (val && val._errors && Array.isArray(val._errors)) {
                        form.setError(key as keyof ClientFormValues, {
                            message: val._errors.join(", "),
                        });
                    }
                });
            }
            toast.error(state.error);
        }
    }, [state, mode, router, STORAGE_KEY, form]);

	const getStepFields = (step: number): (keyof ClientFormValues)[] => {
		switch (step) {
			case 0:
				return ["fullName", "phone", "birthDate", "categoryId", "gender"];
			case 1:
				return []; // flexible intake data
			case 2:
				return []; // membership selection
			case 3:
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
					toast.error("Please fix the errors in the current step before proceeding.");
					return;
				}
			}
			if (currentStep < WIZARD_STEPS.length - 1) {
				setCurrentStep((prev: number) => prev + 1);
			}

		} finally {
			setIsStepPending(false);
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep((prev: number) => prev - 1);
		}
	};


	function onSubmit(values: ClientFormValues) {
		if (currentStep !== WIZARD_STEPS.length - 1) {
			handleNext();
			return;
		}

		startTransition(async () => {
			const formData = new FormData();

			formData.append("fullName", values.fullName);
			formData.append("phone", values.phone);
			if (values.email) formData.append("email", values.email);
			if (values.address) formData.append("address", values.address);
			if (values.profession) formData.append("profession", values.profession);
			formData.append("birthDate", values.birthDate || "");
			formData.append(
				"categoryId",
				values.categoryId || "",
			);
			if (values.gender) formData.append("gender", values.gender);
			if (values.referralSource)
				formData.append("referralSource", values.referralSource);
			if (values.consultationReason)
				formData.append("consultationReason", values.consultationReason);

			if (values.initialProductId) {
				formData.append("initialProductId", values.initialProductId);
			}

			if (values.intakeData) {
				Object.entries(values.intakeData).forEach(([key, val]) => {
					if (val) formData.append(key, val);
				});
			}

			// Append healthLogs as JSON string if exists
			if (values.healthLogs && values.healthLogs.length > 0) {
				formData.append("healthLogs", JSON.stringify(values.healthLogs));
			}

            formAction(formData);
		});
	}

	return (
		<div className="mx-auto w-full max-w-5xl flex-1 space-y-4 p-4 pt-6 md:p-8">
			<div className="flex items-center justify-between space-y-2">
				<h2 className="text-3xl font-bold tracking-tight">
					{mode === "create" ? "Add New Client" : "Edit Client"}
				</h2>
				<div className="flex items-center space-x-2">
					<Button variant="outline" className="bg-card" onClick={() => router.push("/clients")}>
						Cancel
					</Button>
				</div>
			</div>

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
						{currentStep === 0 ? <StepPersonalDetails form={form} categories={categories} /> : null}
						{currentStep === 1 ? (
							<StepHealthWellness
								form={form}
								sections={getHealthSectionsByStep(1)}
							/>
						) : null}
						{currentStep === 2 ? <StepMembership form={form} categories={categories} mode={mode} /> : null}
						{currentStep === 3 ? <StepConsultation form={form} categories={categories} /> : null}
					</FormWizard>
				</form>
			</Form>
		</div>
	);
}
