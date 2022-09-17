export default function (state, states = {}) {
  /*
   * Core Finite State Machine functionality
   * - adheres to Svelte store contract (https://svelte.dev/docs#Store_contract)
   * - invoked events are dispatched to handler of current state
   * - transitions to returned state (or value if static property)
   * - calls _exit() and _enter() methods if they are defined on exited/entered state
   */
  const subscribers = new Set();
  let proxy;

  function subscribe(callback) {
    if (!(callback instanceof Function)) {
      throw new TypeError('callback is not a function');
    }
    subscribers.add(callback);
    callback(state);
    return () => subscribers.delete(callback);
  }

  function notifySubscribers(previous) {
    if (state !== previous) {
      subscribers.forEach((callback) => callback(state));
    }
  }

  function validState(val) {
    return ['string', 'symbol'].includes(typeof val);
  }

  function transition(metadata) {
    let { to, from } = metadata;
    if (!validState(to) || to === from[from.length - 1]) return false;

    to = dispatch('_exit', metadata);
    if (validState(to)) metadata.to = to;

    state = metadata.to;

    to = dispatch('_enter', metadata);
    if (transition({ ...metadata, from: [...from, state], to })) return;

    notifySubscribers(metadata.from[0]);

    return true;
  }

  function dispatch(event, ...args) {
    let action = states[state]?.[event] ?? states['*']?.[event];
    if (action instanceof Function) {
      action = action.apply(proxy, args);
    }
    return action?.valueOf();
  }

  function invoke(event, ...args) {
    const to = dispatch(event, ...args);
    transition({ from: [state], to, event, args });
    return state;
  }

  /*
   * Debounce functionality
   * - `debounce` is lazily bound to dynamic event invoker methods (see Proxy section below)
   * - `event.debounce(wait, ...args)` calls event with args after wait (unless called again first)
   * - cancels all prior invocations made for the same event
   * - cancels entirely when called with `wait` of `null`
   */
  const timeout = {};

  async function debounce(event, wait = 100, ...args) {
    clearTimeout(timeout[event]);
    if (wait === null) {
      return state;
    } else {
      await new Promise((resolve) => timeout[event] = setTimeout(resolve, wait));
      delete timeout[event];
      return invoke(event, ...args);
    }
  }

  /*
   * Proxy-based event invocation API:
   * - return a proxy object with single native subscribe method
   * - all other properties act as dynamic event invocation methods
   * - event invokers also respond to .debounce(wait, ...args) (see above)
   */
  proxy = new Proxy({ subscribe }, {
    get(target, property) {
      if (!Reflect.has(target, property)) {
        target[property] = invoke.bind(null, property);
        target[property].debounce = debounce.bind(null, property);
      }
      return Reflect.get(target, property);
    }
  });

  /*
   * `_enter` initial state and return the proxy object
   */
  dispatch('_enter', { from: [null], to: state, event: null, args: [] });
  return proxy;
}
