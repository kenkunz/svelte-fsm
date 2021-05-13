export default function svelteFsm() {
  function subscribe(callback) {
    if (!(callback instanceof Function)) {
      throw new TypeError('callback is not a function');
    }
  }

  return { subscribe };
}
