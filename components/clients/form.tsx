"use client";

import { startTransition, useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";

import { StepConsultation } from "@/components/clients/forms/consultation";
import { StepHealthWellness } from "@/components/clients/forms/health-wellness";
import { StepMembership } from "@/components/clients/forms/membership";
import { StepPersonalDetails } from "@/components/clients/forms/personal-details";
import { useConfirm } from "@/components/feedback/confirm";
import { FormWizard, type WizardStep } from "@/components/form-wizard";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createClientAction, updateClientAction } from "@/lib/actions/clients/mutations";
import { HEALTH_TEMPLATE, type HealthSection } from "@/lib/config/health";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { 
    type Discount, 
    type HealthLog 
} from "@/lib/types";
import { type ClientFormValues, clientSchema } from "@/lib/validators";

import { zodResolver } from "@hookform/resolvers/zod";

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
    discounts: Discount[];
}

type Draft = { values: Partial<ClientFormValues>; step: number };

const noop = () => () => {};
const draftKey = (mode: ClientFormProps["mode"], id?: string) => `client-form-progress-${mode}-${id || "new"}`;

function forgetDraft(key: string) {
	try {
		localStorage.removeItem(key);
	} catch {
		// Blocked storage: there is no draft to forget.
	}
}

function readDraft(key: string): Draft | null {
	try {
		const saved = JSON.parse(localStorage.getItem(key) ?? "null");
		return saved?.values ? { values: saved.values, step: typeof saved.step === "number" ? saved.step : 0 } : null;
	} catch {
		// A damaged or blocked draft just means starting fresh.
		return null;
	}
}

/**
 * Only a new client's intake is kept as a draft in this browser: it is long,
 * and an edit must always start from what is saved. The draft can only be
 * read in the browser, so the form mounts again once it can, and the server
 * and first browser render stay identical.
 */
export function ClientForm(props: ClientFormProps) {
	const inBrowser = useSyncExternalStore(noop, () => true, () => false);
	const key = draftKey(props.mode, props.initialData?.id);
	const draft = useMemo(
		() => (inBrowser && props.mode === "create" ? readDraft(key) : null),
		[inBrowser, props.mode, key],
	);
	return <ClientFormBody key={inBrowser ? "browser" : "server"} {...props} draft={draft} draftReady={inBrowser} />;
}

function ClientFormBody({
	initialData,
	mode,
	discounts,
	draft,
	draftReady,
}: ClientFormProps & { draft: Draft | null; draftReady: boolean }) {
	const router = useRouter();
	const confirm = useConfirm();
	const keepsDraft = mode === "create";
	const STORAGE_KEY = draftKey(mode, initialData?.id);
	const doneHref = (id?: string) => (id ? `/clients/${id}` : "/clients");

    const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
        if (mode === "edit" && initialData?.id) {
            return await updateClientAction(initialData.id, null, formData);
        } else {
            return await createClientAction(null, formData);
        }
    }, null);

	const [currentStep, setCurrentStep] = useState(draft?.step ?? 0);

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
			discountId: "",
			consultationReason: "",
			intakeData: {},
			...initialData,
			// Ensure enums are set or undefined, not null
			gender: initialData?.gender || undefined,
			referralSource: initialData?.referralSource || undefined,
			// Map active product to initialProductId for Edit mode display
			initialProductId: initialData?.activeProductId || undefined,
			// Map existing healthLogs if any (for Edit mode)
			healthLogs: initialData?.healthLogs || [],
			...draft?.values,
		},
	});


	const watchedValues = useWatch({ control: form.control });
	// Read during render: react-hook-form only tracks what render reads.
	const { isDirty } = form.formState;

	// Edits never keep a draft; drop any left from before (they hold health notes).
	useEffect(() => {
		if (!keepsDraft && draftReady) forgetDraft(STORAGE_KEY);
	}, [keepsDraft, draftReady, STORAGE_KEY]);

	// Keep the draft as she types; never before the saved one has been read.
	useEffect(() => {
		// Nothing typed yet: keep whatever draft there is (or none).
		if (!keepsDraft || !draftReady || !isDirty) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ values: watchedValues, step: currentStep }));
		} catch {
			// Storage full or blocked: the form still works, just without a draft.
		}
	}, [keepsDraft, draftReady, isDirty, watchedValues, currentStep, STORAGE_KEY]);

	const cancel = async () => {
		if (
			(isDirty || draft !== null) &&
			!(await confirm({
				title: mode === "create" ? "Discard this new client?" : "Discard your changes?",
				description: "What you typed here will be lost.",
				confirmLabel: "Discard",
				cancelLabel: "Keep editing",
				destructive: true,
			}))
		) {
			return;
		}
		if (keepsDraft) forgetDraft(STORAGE_KEY);
		router.push(mode === "create" ? "/clients" : doneHref(initialData?.id));
	};


    // Handle server state
    useEffect(() => {
        if (state?.success) {
            notify.success(mode === "create" ? "Client added" : "Changes saved");
            if (keepsDraft) forgetDraft(STORAGE_KEY);
            router.push(doneHref("id" in state && typeof state.id === "string" ? state.id : initialData?.id));
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
            notifyActionError(state, "Something went wrong");
        }
    }, [state, mode, router, STORAGE_KEY, form, keepsDraft, initialData?.id]);

	const getStepFields = (step: number): (keyof ClientFormValues)[] => {
		switch (step) {
			case 0:
				return ["fullName", "phone", "birthDate", "discountId", "gender"];
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
					notify.error("Please fix the errors in the current step before proceeding.");
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
				"discountId",
				values.discountId || "",
			);
			if (values.gender) formData.append("gender", values.gender);
			if (values.referralSource)
				formData.append("referralSource", values.referralSource);
			if (values.consultationReason)
				formData.append("consultationReason", values.consultationReason);

			if (values.initialProductId) {
				formData.append("initialProductId", values.initialProductId);
				formData.append("initialPaymentMethod", values.initialPaymentMethod ?? "cash");
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
					{mode === "create" ? "Add client" : "Edit client"}
				</h2>
				<div className="flex items-center space-x-2">
					<Button variant="outline" className="bg-card" onClick={cancel}>
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
						submitLabel={mode === "create" ? "Add client" : "Save changes"}
						mode={mode}
					>
						{currentStep === 0 ? <StepPersonalDetails form={form} discounts={discounts} /> : null}
						{currentStep === 1 ? (
							<StepHealthWellness
								form={form}
								sections={getHealthSectionsByStep(1)}
							/>
						) : null}
						{currentStep === 2 ? <StepMembership form={form} discounts={discounts} mode={mode} /> : null}
						{currentStep === 3 ? <StepConsultation form={form} discounts={discounts} /> : null}
					</FormWizard>
				</form>
			</Form>
		</div>
	);
}
