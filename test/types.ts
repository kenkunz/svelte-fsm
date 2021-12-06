/*
 * Verify type declarations found in index.d.ts by running:
 * $ npx tsc --noEmit test/types.ts
 */
import fsm from '../index.js';

// @ts-expect-error fsm expects 2 arguments (0 provided)
const invalid1 = fsm();
// @ts-expect-error fsm expects 2 arguments (1 provided)
const invalid2 = fsm('foo');
// @ts-expect-error fsm expects string or symbol for initial state (null provided)
const invalid3 = fsm(null, {});
// @ts-expect-error fsm expects string or symbol for initial state (number provided)
const invalid4 = fsm(1, {});
// @ts-expect-error fsm expects object for states (string provided)
const invalid5 = fsm('foo', 'bar');
// @ts-expect-error fsm expects initial state to match a defined state or fallback
const invalid6 = fsm('foo', {});

const invalid7 = fsm('foo', {
  foo: {
    // @ts-expect-error state expects action to be string or function (object provided)
    bar: {},
    // @ts-expect-error state expects action to be string or function (number provided)
    baz: 1,
    // @ts-expect-error state expects lifecycle action to be function (string provided)
    _enter: 'bar'
  }
});

// A simple, valid state machine
const valid1 = fsm('off', {
  off: {
    toggle: 'on'
  },
  on: {
    toggle() {
      return 'off';
    }
  }
});

// @ts-expect-error subscribe expects callback
valid1.subscribe();
const unsub = valid1.subscribe(() => {});
// @ts-expect-error unsubscribe expects no argumernts
unsub('foo');
unsub();

// @ts-expect-error state machine expects valid event invocation
valid1.noSuchAction();

// @ts-expect-error toggle expects no arguments (1 provided)
valid1.toggle(1);
valid1.toggle();

// A state machine with fallback state (any initial state permitted)
const valid2 = fsm('initial', {
  '*': {
    foo: () => {}
  },
});
valid2.foo();

// A state machine with overloaded action signatures
const valid3 = fsm('initial', {
  '*': {
    overloaded(one) {}
  },
  'foo': {
    overloaded(one, two) {}
  }
});
// @ts-expect-error overloaded expects 1 or 2 args (0 provided)
valid3.overloaded();
valid3.overloaded(1);
valid3.overloaded(1, 2);
// @ts-expect-error overloaded expects 1 or 2 args (3 provided)
valid3.overloaded(1, 2, 3);
