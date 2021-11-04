# Svelte FSM

A tiny, simple, expressive, pramgmatic [Finite State
Machine](https://en.wikipedia.org/wiki/Finite-state_machine) (FSM) library, optimized for
[Svelte](https://svelte.dev).
* **tiny:** under `1kb` (minified); zero dependencies
* **simple:** implements core FSM features, not the kitchen sink
* **expressive:** FSM constructs are mapped to core JavaScript features (see [Usage](#usage) below)
* **pragmatic:** prioritizes developer happiness over strict adherance to FSM or Statechart
formalizations
* **Svelte-optimized:** implements Svelte's [store
contract](https://svelte.dev/docs#Store_contract); philosophically aligned – feels at-home in a
Svelte codebase

## Usage

Svelte FSM's API is delightfully simple. FSM constructs are intuitively mapped to core JavaScript
language features, resulting in a highly expressive API that's effortless to remember, a joy to
write, and natural to read.
* an **fsm** is defined by calling the default export `fsm()` function with 2 arguments: `initial`
and `states`
* **states** are just top-level object keys
* **events** are invoked as function calls, and are defined as simple properties or functions
* **transitions** are just property values or function return values
* **actions** are just functions
* **timers** (often used in state machines) are available by calling `.debounce(wait)` on any event
* **context** is just… *context*! (i.e., the lexical scope of your fsm)

See [Full API](#full-api) below.

## Examples

### Simple on/off switch
[View in Svelte REPL](https://svelte.dev/repl/431cef60a5554253b00dfdde2ad096ec)

```javascript
import fsm from 'svelte-fsm';

const simpleSwitch = fsm('off', {
  off: { toggle: 'on'  },
  on:  { toggle: 'off' }
});

simpleSwitch.toggle(); // => 'on'
simpleSwitch.toggle(); // => 'off'
```

### Traffic light using timers
[View in Svelte REPL](https://svelte.dev/repl/7da59b636bbb4fbab27c5c932619bbc8)

```javascript
import fsm from 'svelte-fsm';

const trafficLight = fsm('initial', {
  initial: { start: 'green' },

  green: {
    _enter() { trafficLight.change.debounce(20000); },
    change: 'yellow'
  },

  yellow: {
    _enter() { trafficLight.change.debounce(5000); },
    change: 'red'
  },

  red: {
    _enter() { trafficLight.change.debounce(20000); },
    change: 'green'
  }
});

trafficLight.subscribe(console.log);
trafficLight.start();
// [ immiadetely  ] => 'initial'
// [ immiadetely  ] => 'green'
// [ after 20 sec ] => 'yellow'
// [ after  5 sec ] => 'red'
// [ after 20 sec ] => 'green'
// ...
```

### Within a Svelte-component – form states (entering, submitting, invalid, etc.)
[View in Svelte REPL](https://svelte.dev/repl/7da59b636bbb4fbab27c5c932619bbc8)

## Full API

### Creating a state machine object

**Svelte FSM** exports a single default function. Import this as `fsm`, `svelteFsm`, or whatever
seems appropriate in your project.
```javascript
import fsm from 'svelte-fsm'
```
This function expects two arguments: `initialState` and `states`. The following is technically a
valid but completely useless state machine:
```javascript
const myFsm = fsm('initial', {});
```

### States

Each **state** is a top-level property of the `states` object. The state's _key_ can be any valid
object property name (string or Symbol), but we recommend you use descriptive string values. The
state's _value_ is an object including _transitions_ and _actions_. The simplest state definition is
just an empty object. You might use this for a final state where no further transitions or actions
are possible.
```javascript
const myFsm = fsm('initial', {
  initial: {
    finish: 'final'
  },

  final: {}
});
```

### Transitions

As shown in the example above, a simple transition is defined by a key represending an _event_
that can be invoked on the FSM object, and a value indicating the state to be transitioned to. In
addition, _action_ methods (see below) can optionally return a state value to be transitioned to.
The following simple action-based transition is equivalent to the example above:
```javascript
const myFsm = fsm('initial', {
  initial: {
    finish() { return 'final'; }
  },

  final: {}
});
```

### Actions

As already hinted, states can include methods called _actions_. An action may or may not result in a
transition. Actions are useful for _side-effects_ (requesting data, modifying context, generating
output, etc.) as well as for _conditional_ or (_guarded_) transitions. Since an action _optionally_
returns a transition state, a single action might result in a transition in some circumstances and
not others, and may result in different transitions. Actions can also optionally receive arguments.
```javascript
const max = 10;
let level = 0;

const bucket = fsm('notFull', {
  notFull: {
    add(amount) {
      level += amount;
      if (level === max) {
        return 'full';
      } else if (level > max) {
        return 'overflowing';
      }
    }
  },

  full: {
    add(amount) {
      level += amount;
      return 'overflowing';
    }
  },

  overflowing: {
    add(amount) {
      level += amount;
    }
  }
});
```

### Lifecycle Actions

States can also include three special lifecycle actions:
* `_init` (experimental): called when a new FSM object is created with `initialState` matching the
state.
* `_enter`: called when the state is entered
* `_exit`: called when the state is exited

Unlike noromal actions, lifecycle methods cannot return a state transition (return values are
ignored). These methods are called _during_ a transition and cannot modify the outcome of it.

Currently, lifecycle actions do not receive any arguments. This may be changed in an upcoming
version.
```javascript
const max = 10;
let level = 0;
let spillage = 0;

const bucket = fsm('notFull', {
  notFull: {
    add(amount) {
      level += amount;
      if (level === max) {
        return 'full';
      } else if (level > max) {
        return 'overflowing';
      }
    }
  },

  full: {
    add(amount) {
      level += amount;
      return 'overflowing';
    }
  },

  overflowing: {
    _enter() {
      spillage = level - max;
      level = max;
    }

    add(amount) {
      spillage += amount;
    }
  }
});
```

### Event invocation

Conceptually, invoking an event on an FSM object is _asking it to do something_. The object decides
_what_ to do based on what state it's in. The most natural syntax for _asking an object to do
something_ is simply a function call. Event invocations can include arguments, which are passed
to matching actions.
```javascript
myFsm.finish(); // => 'final'
bucket.add(10); // => 'full'
```
The resulting state of the object is returned from invocations. In addition, _subscribers_
are notified if the state changes (see below).

Events can be invoked with a delay by appending `.debounce` to any invocation. The first argument
to `debounce` should be the wait time in milliseconds; subsequent arguemnts are forwarded to the
action. If `debounce` is called again before the timer has completed, the original timer is canceled
and replaced with the new one (even if the delay time is different).
```javascript
bucket.add.debounce(2); // => Promise that resolves with 'overflowing'
```
`debounce` invocations return a Promise that resolves with the resulting state if the invocation
executes. Canceled invocations (due to a subsequent `debounce` call) never resolve.

### Subscribing to state changes

**Svelte FSM** adheres to Svelte's [store contract](https://svelte.dev/docs#Store_contract). You
can use this outside of Svelte components by calling `subscribe` with a callback (which returns an
`unsubscribe` function).
```javascript
const unsub = bucket.subscribe(console.log);
bucket.add(5); // [console] => 'notFull'
bucket.add(5); // [console] => 'full'
bucket.add(5); // [console] => 'overflowing'
```
Within a Svelte Component, you can use the `$` syntactic sugar to access the current value of the
store. Svelte FSM does _not_ implement a `set` method, so you can't assign it directly. (This is
intentional – finite state machines only change state based on the defined transitions and event
invocations).
```svelte
<div class={$bucket}>
  The bucket is {$bucket === 'notFull' ? 'not full' : $bucket}
</div>
<input type="number" bind:value>
<button type="button" on:click={() => bucket.add(value)}>
```
