export default function svelteFsm(state, states = {}) {
  const subscribers = new Set();

  function subscribe(callback) {
    if (!(callback instanceof Function)) {
      throw new TypeError('callback is not a function');
    }
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  function transition(newState) {
    state = newState;
    subscribers.forEach(callback => callback(state));
  }

  function dispatch(event) {
    const value = states[state]?.[event];
    return (value instanceof Function) ? value() : value;
  }

  function handle(event) {
    let newState = dispatch(event);
    if (newState !== undefined) {
      transition(newState);
    }
  }

  return { subscribe, handle };
}
