
import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

// Type definition for the events that can be emitted.
type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class ErrorEmitter extends EventEmitter {
  // Overload the 'emit' method for type safety.
  emit<E extends keyof ErrorEvents>(event: E, ...args: Parameters<ErrorEvents[E]>): boolean {
    return super.emit(event, ...args);
  }

  // Overload the 'on' method for type safety.
  on<E extends keyof ErrorEvents>(event: E, listener: ErrorEvents[E]): this {
    return super.on(event, listener);
  }
}

// Create and export a singleton instance of the error emitter.
// This ensures that the same emitter is used throughout the application.
export const errorEmitter = new ErrorEmitter();
