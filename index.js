export default function svelteFsm(state, states = {}) {
  const subscribers = new Set();

  function subscribe(callback) {
    subscribers.add(callback);
    callback(state);
    return () => subscribers.delete(callback);
  }

  function transition(newState) {
    state = newState;
    subscribers.forEach((callback) => callback(state));
  }

  function dispatch(event, ...args) {
    const value = states[state]?.[event];
    return value instanceof Function ? value(...args) : value;
  }

  async function handle(event, ...args) {
    const newState = await dispatch(event, ...args);
    if (newState !== undefined && newState !== state) {
      await dispatch('_exit');
      transition(newState);
      await dispatch('_enter');
    }
  }

  const fsm = { subscribe };

  const handler = {
    get: function (target, property, receiver) {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      } else {
        return handle.bind(null, property);
      }
    }
  };

  return new Proxy(fsm, handler);
}
