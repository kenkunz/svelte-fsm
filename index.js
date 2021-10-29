export default function svelteFsm(state, states = {}) {
  /*
   * Core Finite State Machine functionality
   * - adheres to Svelte store contract (https://svelte.dev/docs#Store_contract)
   * - invoked events are dispatched to handler of current state
   * - transitions to returned state (or value if static property)
   * - calls _exit() and _enter() methods if they are defined on exited/entered state
   */
  const subscribers = new Set();

  function subscribe(callback) {
    subscribers.add(callback);
    callback(state);
    return () => subscribers.delete(callback);
  }

  function transition(newState) {
    dispatch('_exit');
    state = newState;
    subscribers.forEach((callback) => callback(state));
    dispatch('_enter');
  }

  function dispatch(event, ...args) {
    const value = states[state]?.[event];
    return value instanceof Function ? value(...args) : value;
  }

  function invoke(event, ...args) {
    const newState = dispatch(event, ...args);
    if (newState !== undefined && newState !== state) {
      transition(newState);
    }
  }

  dispatch('_init');

  /*
   * Debounce functionality
   * - debouncer methed is bound to dynamic event invoker methods (see Proxy section below)
   * - event.debounce(wait) returns a debounced verion of event invoker
   * - may be called with different wait values; debounces all event invocations for the same
   *   invoker method (based on the property name)
   */
  const timeout = {};

  async function debounce(wait, event, ...args) {
    clearTimeout(timeout[event]);
    await new Promise((resolve) => timeout[event] = setTimeout(resolve, wait));
    delete timeout[event];
    return invoke(event, ...args);
  }

  function debouncerFor(event) {
    return (wait = 100) => debounce.bind(null, wait, event);
  }

  /*
   * Proxy-based event invocation API:
   * - return a proxy object with single native subscribe method
   * - all other properties act as dynamic event invocation methods
   * - event invokers also respond to .debounce(wait), returning a debounced event invoker
   * - subscribe() also behaves as an event invoker when called with any args other than a
   *   single callback (or when debounced)
   */
  function subscribeOrInvoke(...args) {
    if (args.length === 1 && args[0] instanceof Function) {
      return subscribe(args[0]);
    } else {
      invoke('subscribe', ...args);
    }
  }

  subscribeOrInvoke.debounce = debouncerFor('subscribe');

  return new Proxy({ subscribe: subscribeOrInvoke }, {
    get(target, property) {
      if (!Reflect.has(target, property)) {
        target[property] = invoke.bind(null, property);
        target[property].debounce = debouncerFor(property);
      }
      return Reflect.get(target, property);
    }
  });
}
