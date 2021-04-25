function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function runAsync(fn) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  Promise.resolve.apply(Promise, args).then(fn);
}
function ensureListenersAreValid(listeners) {
  if (Array.isArray(listeners)) {
    listeners.forEach(function (listener, index) {
      if (typeof listener !== "function") {
        throw new Error("Event stream listeners must be functions, received '".concat(_typeof(listener), "' at index '").concat(index, "'"));
      }
    });
  } else if (listeners !== null && listeners !== undefined) {
    throw new Error("Event stream listeners must be null, undefined, or an array of functions({ key, args })");
  }
}

/* eslint-disable func-names */

function EventStream(listeners) {
  this.events = {};
  this.listeners = listeners;
}

EventStream.prototype.register = function (key, handler) {
  var subscriptions = {};
  var listeners = this.listeners;

  function eventHandler() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (typeof handler === "function") {
      handler.apply(void 0, args);
    }

    Object.values(subscriptions).forEach(function (subscriptionHandler) {
      runAsync.apply(void 0, [subscriptionHandler].concat(args));
    });
    (listeners !== null && listeners !== void 0 ? listeners : []).forEach(function (middleware) {
      runAsync(function () {
        return middleware({
          key: key,
          args: args
        });
      });
    });
  }

  this.events[key] = {
    subIndex: 0,
    key: key,
    handler: handler,
    eventHandler: eventHandler,
    subscriptions: subscriptions
  };
  return eventHandler;
};

EventStream.prototype.fireEvent = function (key) {
  var eventDefinition = this.events[key];

  if (eventDefinition) {
    var eventHandler = eventDefinition.eventHandler;

    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    eventHandler.apply(void 0, args);
  }
};

EventStream.prototype.subscribe = function (eventKey, handler) {
  var eventsReference = this.events;
  var eventDefinition = eventsReference[eventKey];

  if (eventDefinition) {
    var subscriptionKey = "sub-".concat(eventDefinition.subIndex);
    eventDefinition.subIndex += 1;
    eventDefinition.subscriptions[subscriptionKey] = handler;

    var unsubscribe = function unsubscribe() {
      if (eventsReference[eventKey]) {
        delete eventsReference[eventKey].subscriptions[subscriptionKey];
      }
    };

    return {
      unsubscribe: unsubscribe,
      id: subscriptionKey
    };
  }

  return {}; // silently fail with an id and unsubscribe as undefined
};

EventStream.prototype.removeEvent = function (key) {
  delete this.events[key];
};

EventStream.prototype.removeAllEvents = function () {
  Object.keys(this.events).forEach(this.removeEvent.bind(this));
};

function createEventStream(listeners) {
  ensureListenersAreValid();
  return new EventStream(listeners);
}

export { createEventStream };
