export default function svelteFsm(state, states = {}) {
  const subscribers = new Set();

  function subscribe(callback) {
    if (!(callback instanceof Function)) {
      throw new TypeError('callback is not a function');
    }
    subscribers.add(callback);
    callback(state);
    return () => subscribers.delete(callback);
  }

  function notifySubscribers() {
    subscribers.forEach(callback => callback(state));
  }

  function transition(newState) {
    dispatch('_exit');
    state = newState;
    notifySubscribers();
    dispatch('_enter');
  }

  function dispatch(event, ...args) {
    const value = states[state]?.[event];
    return (value instanceof Function) ? value(...args) : value;
  }

  function handle(event, ...args) {
    const newState = dispatch(event, ...args);
    if (newState !== undefined && newState !== state) {
      transition(newState);
    }
  }

  return { subscribe, handle };
}
