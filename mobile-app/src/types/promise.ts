/**
 * TypeScript helper for Promise.withResolvers pattern
 * 
 * This pattern is used by SessionConnectorWrapper to manage
 * async connection flows that span app lifecycle events.
 */

/**
 * Interface matching the return type of Promise.withResolvers()
 * Allows external resolution/rejection of a Promise.
 */
export interface WithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Polyfill for Promise.withResolvers if not available
 * (Available in modern browsers, but good to have a fallback)
 */
export function createWithResolvers<T>(): WithResolvers<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}
