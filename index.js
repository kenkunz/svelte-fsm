export default function svelteFsm(state, states = {}) {
  const subscribers = new Set();

  function subscribe(callback) {
    if (!(callback instanceof Function)) {
      throw new TypeError('callback is not a function');
    }
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  function set(newState) {
    state = newState;
    subscribers.forEach(callback => callback(state));
  }

  function handle(event) {
    let newState = states[state]?.[event];
    if (newState !== undefined) {
      set(newState);
    }
  }

  return { subscribe, handle };
}
