
'use client';

import React, { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';

// This component listens for custom Firestore permission errors and displays them
// in the Next.js development error overlay. This is for development purposes only.
export default function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // Define the handler function for the 'permission-error' event.
    const handleError = (permissionError: FirestorePermissionError) => {
      console.warn(
        "FirebaseErrorListener caught a permission error. This will be thrown to display in the Next.js overlay for debugging."
      );
      setError(permissionError);
    };

    // Register the handler with the global error emitter.
    errorEmitter.on('permission-error', handleError);

    // Clean up by removing the listener when the component unmounts.
    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  // If an error has been caught, throw it. In a Next.js development environment,
  // this will trigger the error overlay, making debugging much easier.
  if (error) {
    throw error;
  }

  // This component does not render anything to the DOM.
  return null;
}
