import { useRef } from "react";

export function deepCompare(a: any, b: any): boolean {
  // Check for strict equality (handles primitives and reference equality)
  if (a === b) return true;

  // Check for null or undefined
  if (a == null || b == null) return a === b;

  // Check for Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Check for Array objects
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepCompare(a[i], b[i])) return false;
    }
    return true;
  }

  // Check for plain objects
  if (typeof a === "object" && typeof b === "object") {
    // Compare object prototypes
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Compare number of keys
    if (keysA.length !== keysB.length) return false;

    // Compare keys in 'a' to keys in 'b'
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepCompare(a[key], b[key])) return false;
    }

    return true;
  }

  // If none of the above, values are not equal
  return false;
}

function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  const valueRef = useRef<{ deps: any[]; value: T }>();

  if (!valueRef.current || !deepCompare(valueRef.current.deps, deps)) {
    valueRef.current = { deps, value: factory() };
  }

  return valueRef.current.value;
}

export default useDeepMemo;
