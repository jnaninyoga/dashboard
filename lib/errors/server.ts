import { newErrorCode } from "./report";

/**
 * Logs an unexpected server failure under a short code and returns it.
 * Send the code back to the client (`{ error, ref }`): it is shown in the
 * error toast, so the code the operator reports matches this log line.
 */
export function logServerError(scope: string, error: unknown): string {
	const code = newErrorCode();
	console.error(`[${code}] ${scope}:`, error);
	return code;
}
