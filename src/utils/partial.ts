export const partialRight =
  (fn: Function, ...partials: any[]) =>
  (...args: any[]) =>
    fn(...args, ...partials);
