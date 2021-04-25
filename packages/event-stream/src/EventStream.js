/* eslint-disable func-names */
import { ensureListenersAreValid, runAsync } from "./utils";

function EventStream(listeners) {
  this.events = {};
  this.listeners = listeners;
}

EventStream.prototype.register = function(key, handler) {
  const subscriptions = {};
  const { listeners } = this;

  function eventHandler(...args) {
    if (typeof handler === "function") {
      handler(...args);
    }
    Object.values(subscriptions).forEach(subscriptionHandler => {
      runAsync(subscriptionHandler, ...args);
    });
    (listeners ?? []).forEach(middleware => {
      runAsync(() => middleware({ key, args }));
    });
  }

  this.events[key] = { subIndex: 0, key, handler, eventHandler, subscriptions };

  return eventHandler;
};

EventStream.prototype.fireEvent = function(key, ...args) {
  const eventDefinition = this.events[key];
  if (eventDefinition) {
    const { eventHandler } = eventDefinition;
    eventHandler(...args);
  }
};

EventStream.prototype.subscribe = function(eventKey, handler) {
  const eventsReference = this.events;
  const eventDefinition = eventsReference[eventKey];

  if (eventDefinition) {
    const subscriptionKey = `sub-${eventDefinition.subIndex}`;

    eventDefinition.subIndex += 1;
    eventDefinition.subscriptions[subscriptionKey] = handler;

    const unsubscribe = () => {
      if (eventsReference[eventKey]) {
        delete eventsReference[eventKey].subscriptions[subscriptionKey];
      }
    };

    return {
      unsubscribe,
      id: subscriptionKey,
    };
  }
  return {}; // silently fail with an id and unsubscribe as undefined
};

EventStream.prototype.removeEvent = function(key) {
  delete this.events[key];
};

EventStream.prototype.removeAllEvents = function() {
  Object.keys(this.events).forEach(this.removeEvent.bind(this));
};

export function createEventStream(listeners) {
  ensureListenersAreValid();
  return new EventStream(listeners);
}

export default EventStream;
