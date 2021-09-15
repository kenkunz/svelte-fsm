export default function svelteFsm(state, states = {}) {
  const subscribers = new Set();

  function subscribeOrHandle(...args) {
    if (args.length === 1 && args[0] instanceof Function) {
      return subscribe(args[0]);
    } else {
      handle('subscribe', ...args);
    }
  }

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

  return new Proxy({}, {
    get(target, property) {
      return (property === 'subscribe') ? subscribeOrHandle : handle.bind(null, property);
    }
  });
}
