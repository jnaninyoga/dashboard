export interface HealthField {
	label: string;
	key: string; // Unique key for data mapping
	type?: "text" | "textarea" | "select" | "radio";
	options?: string[];
	placeholder?: string;
}

export interface HealthSection {
	category: "physical" | "mental" | "lifestyle" | "medical_history";
	label: string;
	fields: HealthField[];
}

export const HEALTH_TEMPLATE: HealthSection[] = [
	{
		category: "physical",
		label: "General Therapies & Supplements",
		fields: [
			// Medications are now linked to specific active conditions
			{
				label: "Psychotherapy",
				key: "psychotherapy",
				placeholder: "Details...",
			},
			{
				label: "Nutritional Supplements",
				key: "supplements",
				placeholder: "Vitamins, etc...",
			},
			{
				label: "Phytotherapy",
				key: "phytotherapy",
				placeholder: "Herbal remedies...",
			},
			{
				label: "Other",
				key: "other_care",
				placeholder: "Any other treatments...",
			},
		],
	},
	{
		category: "medical_history",
		label: "Medical History",
		fields: [
			{
				label: "Osteoarticular",
				key: "history_osteoarticular",
				placeholder: "Joints, bones...",
			},
			{
				label: "Cardiac",
				key: "history_cardiac",
				placeholder: "Heart conditions...",
			},
			{
				label: "Metabolic",
				key: "history_metabolic",
				placeholder: "Diabetes, thyroid...",
			},
			{
				label: "Respiratory",
				key: "history_respiratory",
				placeholder: "Asthma, etc...",
			},
			{
				label: "Digestive",
				key: "history_digestive",
				placeholder: "Stomach, gut...",
			},
			{
				label: "Urinary",
				key: "history_urinary",
				placeholder: "Kidney, bladder...",
			},
			{
				label: "Gyneco-obstetric",
				key: "history_gyneco",
				placeholder: "Pregnancies, etc...",
			},
			{
				label: "Neurological",
				key: "history_neurological",
				placeholder: "Migraines, etc...",
			},
			{
				label: "Immunological",
				key: "history_immunological",
				placeholder: "Allergies, autoimmunity...",
			},
			{
				label: "Endocrine",
				key: "history_endocrine",
				placeholder: "Hormonal issues...",
			},
			{ label: "Blood", key: "history_blood", placeholder: "Anemia, etc..." },
			{
				label: "Surgical History",
				key: "history_surgical",
				placeholder: "Past surgeries...",
			},
			{
				label: "Accidents / Traumas",
				key: "history_trauma",
				placeholder: "Major accidents...",
			},
		],
	},
	{
		category: "mental",
		label: "Mental & Emotional Health",
		fields: [
			{
				label: "Anxiety / Depression",
				key: "anxiety_depression",
				placeholder: "History or current state...",
			},
			{
				label: "Emotional Shocks",
				key: "emotional_shocks",
				placeholder: "Significant life events...",
			},
		],
	},
	{
		category: "lifestyle",
		label: "Lifestyle & Well-being",
		fields: [
			// Merged Quality of Life + Lifestyle
			{
				label: "Fatigue / Vitality",
				key: "qol_fatigue",
				type: "select",
				options: ["High Vitality", "Normal", "Tired", "Exhausted"],
			},
			{
				label: "Emotional State",
				key: "qol_happiness",
				type: "select",
				options: ["Happy", "Content", "Sad", "Feeling Useless"],
			},
			{
				label: "Stress / Relaxation",
				key: "qol_stress",
				type: "select",
				options: ["Relaxed", "Moderate Stress", "High Stress", "Overwhelmed"],
			},
			{
				label: "Acceptance / Letting Go",
				key: "qol_acceptance",
				placeholder: "Ability to let go...",
			},
			{
				label: "Sleep",
				key: "lifestyle_sleep",
				placeholder: "Quality, hours...",
			},
			{
				label: "Diet / Nutrition",
				key: "lifestyle_diet",
				placeholder: "Vegetarian, allergies...",
			},
			{
				label: "Sports Activity",
				key: "lifestyle_sports",
				placeholder: "Frequency, type...",
			},
			{
				label: "Yoga / Meditation Practice",
				key: "lifestyle_yoga",
				placeholder: "Experience level...",
			},
		],
	},
];
