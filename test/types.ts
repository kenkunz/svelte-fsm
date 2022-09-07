/*
 * Verify type declarations found in index.d.ts by running:
 * $ npx tsc --noEmit --target es6 test/types.ts
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
// @ts-expect-error subscribe expects callback
valid1.subscribe('foo');

const unsub = valid1.subscribe(() => {});
// @ts-expect-error unsubscribe expects no arguments
unsub('foo');
unsub();

// @ts-expect-error state machine expects valid event invocation
valid1.noSuchAction();

// can pass any argument if action get's never typed
valid1.toggle();
valid1.toggle(1);
valid1.toggle(true, 1);
valid1.toggle('test', true, 1);

const toggleResultValid: string | symbol = valid1.toggle();
// @ts-expect-error toggle returns string or symbol
const toggleResultInvalid: number = valid1.toggle();

// A state machine with fallback state (any initial state permitted)
const valid2 = fsm('initial', {
  '*': {
    foo: () => {}
  }
});
valid2.foo();

// A state machine with overloaded action signatures
const valid3 = fsm('initial', {
  '*': {
    overloaded(one: number) {
      return 'foo';
    }
  },
  foo: {
    overloaded(one: string, two: number) {}
  }
});
// @ts-expect-error overloaded expects 1 or 2 args (0 provided)
valid3.overloaded();
// @ts-expect-error overloaded expects first argument as number
valid3.overloaded('string');
valid3.overloaded(1);
// @ts-expect-error overloaded expects first argument as string
valid3.overloaded(1, 2);
valid3.overloaded('string', 2);
// @ts-expect-error overloaded expects 1 or 2 args (3 provided)
valid3.overloaded(1, 2, 3);

// @ts-expect-error overloaded with single argument returns string | symbol
const overloadedResult1Invalid: void = valid3.overloaded(1);
const overloadedResult1Valid: string | symbol = valid3.overloaded(1);

// @ts-expect-error overloaded with two arguments returns string | symbol
const overloadedResult2Invalid: void = valid3.overloaded('string', 1);
const overloadedResult2Valid: string | symbol = valid3.overloaded('string', 1);

// A state machine that uses symbols as a state keys
const valid4 = fsm(Symbol.for('foo'), {
  [Symbol.for('foo')]: {
    bar: Symbol.for('bar')
  }
});
const symbolResultValid: string | symbol = valid4.bar();
