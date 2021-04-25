'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));

var eventStreamRenderUtils = Object.seal({
  eventStreams: {},
  providerKeysIndex: 0,
  renderedProvidersCount: 0
});
function getEventStreamInstance(key) {
  return eventStreamRenderUtils.eventStreams[key];
}
function invokeIfPresent(fn) {
  if (typeof fn === "function") {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    fn.apply(void 0, args);
  }
}

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

var EventStreamContext = /*#__PURE__*/React.createContext(null);
function useEventStreamContext() {
  return React.useContext(EventStreamContext);
}

function EventStreamProvider(_ref) {
  var children = _ref.children,
      listeners = _ref.listeners,
      providerKey = _ref.providerKey,
      setInstance = _ref.setInstance;
  var providerUniqueKey = React.useMemo(function () {
    if (providerKey) {
      return providerKey;
    }

    eventStreamRenderUtils.providerKeysIndex += 1;
    var keyCandidate = eventStreamRenderUtils.providerKeysIndex; // loop and increment until this becomes falsy

    while (eventStreamRenderUtils.eventStreams[keyCandidate]) {
      keyCandidate += 1;
    }

    eventStreamRenderUtils.providerKeysIndex = keyCandidate;
    return keyCandidate;
  }, [providerKey]);
  var eventStream = React.useMemo(function () {
    return createEventStream(listeners);
  }, [listeners]); // this counts the active current rendered event stream providers

  React.useEffect(function () {
    eventStreamRenderUtils.renderedProvidersCount += 1;
    return function () {
      eventStreamRenderUtils.renderedProvidersCount -= 1;
    };
  }, []);
  React.useEffect(function () {
    invokeIfPresent(setInstance, eventStream);
  }, [eventStream, setInstance]);
  var contextValue = React.useMemo(function () {
    return {
      on: eventStream.subscribe.bind(eventStream),
      register: eventStream.register.bind(eventStream),
      fireEvent: eventStream.fireEvent.bind(eventStream),
      removeEvent: eventStream.removeEvent.bind(eventStream)
    };
  }, [eventStream]); // removes the events from event stream on cleanup

  React.useEffect(function () {
    eventStreamRenderUtils.eventStreams[providerUniqueKey] = eventStream;
    return function () {
      delete eventStreamRenderUtils.eventStreams[providerUniqueKey];
      eventStream.removeAllEvents();
    };
  }, [providerUniqueKey, eventStream]);
  return /*#__PURE__*/React.createElement(EventStreamContext.Provider, {
    value: contextValue
  }, children);
}

exports.EventStreamContext = EventStreamContext;
exports.EventStreamProvider = EventStreamProvider;
exports.getEventStreamInstance = getEventStreamInstance;
exports.useEventStreamContext = useEventStreamContext;
