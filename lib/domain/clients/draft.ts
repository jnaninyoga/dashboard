/**
 * Where an unfinished client form is kept in this browser. A new client has
 * one draft, a client being edited one each, and a client added from a
 * booking one per booking: otherwise an old half-filled form would show
 * another person's name and phone, and this visitor's details would come
 * back on the next unrelated "Add client".
 */
export function clientDraftKey(mode: "create" | "edit", id?: string, source?: string): string {
	return `client-form-progress-${mode}-${id || source || "new"}`;
}
