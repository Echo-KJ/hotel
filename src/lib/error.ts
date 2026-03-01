/**
 * Normalizes various error types into a standard Error object with a helpful message.
 * Supports:
 * - Error objects
 * - Strings
 * - Supabase/PostgREST error objects { code, message, details, hint }
 * - Unknown objects
 */
export function normalizeError(err: any): Error {
    if (err instanceof Error) {
        return err;
    }

    if (typeof err === "string") {
        return new Error(err);
    }

    if (err && typeof err === "object") {
        // Handle Supabase/PostgREST errors
        if (err.message && err.code) {
            return new Error(`Database Error [${err.code}]: ${err.message} ${err.details ? `(${err.details})` : ""}`);
        }

        // Handle generic objects with message
        if (err.message) {
            return new Error(String(err.message));
        }

        try {
            return new Error(JSON.stringify(err));
        } catch {
            return new Error("Unknown error occurred");
        }
    }

    return new Error("Unknown error occurred");
}

export function logError(context: string, err: any) {
    const normalized = normalizeError(err);
    console.error(`[${context}]`, {
        message: normalized.message,
        stack: normalized.stack,
        original: err,
    });
}
