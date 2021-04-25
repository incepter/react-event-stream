import React from "react";

export const EventStreamContext = React.createContext(null);

export function useEventStreamContext() {
  return React.useContext(EventStreamContext);
}
