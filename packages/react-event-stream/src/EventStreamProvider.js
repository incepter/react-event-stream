import React from "react";
import { createEventStream } from "event-stream";
import { EventStreamContext } from "./context";
import { invokeIfPresent, eventStreamRenderUtils } from "./shared";

export function EventStreamProvider({
  children,
  listeners,
  providerKey,
  setInstance, // called automatically if it changes, or the event stream instance changes, receiving the instance as only parameter
}) {
  const providerUniqueKey = React.useMemo(() => {
    if (providerKey) {
      return providerKey;
    }
    eventStreamRenderUtils.providerKeysIndex += 1;
    let keyCandidate = eventStreamRenderUtils.providerKeysIndex;

    // loop and increment until this becomes falsy
    while (eventStreamRenderUtils.eventStreams[keyCandidate]) {
      keyCandidate += 1;
    }

    eventStreamRenderUtils.providerKeysIndex = keyCandidate;
    return keyCandidate;
  }, [providerKey]);

  const eventStream = React.useMemo(() => createEventStream(listeners), [
    listeners,
  ]);

  // this counts the active current rendered event stream providers
  React.useEffect(() => {
    eventStreamRenderUtils.renderedProvidersCount += 1;
    return () => {
      eventStreamRenderUtils.renderedProvidersCount -= 1;
    };
  }, []);

  React.useEffect(() => {
    invokeIfPresent(setInstance, eventStream);
  }, [eventStream, setInstance]);

  const contextValue = React.useMemo(
    () => ({
      on: eventStream.subscribe.bind(eventStream),
      register: eventStream.register.bind(eventStream),
      fireEvent: eventStream.fireEvent.bind(eventStream),
      removeEvent: eventStream.removeEvent.bind(eventStream),
    }),
    [eventStream],
  );

  // removes the events from event stream on cleanup
  React.useEffect(() => {
    eventStreamRenderUtils.eventStreams[providerUniqueKey] = eventStream;
    return () => {
      delete eventStreamRenderUtils.eventStreams[providerUniqueKey];
      eventStream.removeAllEvents();
    };
  }, [providerUniqueKey, eventStream]);

  return (
    <EventStreamContext.Provider value={contextValue}>
      {children}
    </EventStreamContext.Provider>
  );
}
