export function runAsync(fn, ...args) {
  Promise.resolve(...args).then(fn);
}

export function ensureListenersAreValid(listeners) {
  if (Array.isArray(listeners)) {
    listeners.forEach((listener, index) => {
      if (typeof listener !== "function") {
        throw new Error(
          `Event stream listeners must be functions, received '${typeof listener}' at index '${index}'`,
        );
      }
    });
  } else if (listeners !== null && listeners !== undefined) {
    throw new Error(
      "Event stream listeners must be null, undefined, or an array of functions({ key, args })",
    );
  }
}
