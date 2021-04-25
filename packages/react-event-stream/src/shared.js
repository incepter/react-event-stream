export const eventStreamRenderUtils = Object.seal({
  eventStreams: {},
  providerKeysIndex: 0,
  renderedProvidersCount: 0,
});

export function getEventStreamInstance(key) {
  return eventStreamRenderUtils.eventStreams[key];
}

export function invokeIfPresent(fn, ...args) {
  if (typeof fn === "function") {
    fn(...args);
  }
}
