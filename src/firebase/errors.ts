
// A custom error class that provides more context on why a Firestore operation failed.
export type SecurityRuleContext = {
    // The path of the Firestore document or collection that was being accessed.
    path: string;
    // The type of operation that was being performed.
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    // The data that was being sent to Firestore (for create/update operations).
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    public readonly context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
            {
                // Simulate the properties available in Firestore Security Rules for easier debugging.
                request: {
                    method: context.operation,
                    path: `/databases/(default)/documents/${context.path}`,
                    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
                },
                // In a real scenario, you'd populate this from the user's auth state.
                auth: {
                    uid: '(unknown_user)', // Placeholder, should be replaced with actual user UID
                    token: {},
                },
            },
            null,
            2
        )}`;

        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;

        // This is necessary for Error subclasses in TypeScript.
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
