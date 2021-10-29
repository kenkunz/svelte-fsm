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

### 1. A simple on/off switch

```javascript
import fsm from 'svelte-fsm';

const switch = fsm('on', {
  on:  { toggle: 'off' },
  off: { toggle: 'on'  }
});

switch.toggle(); // => 'off'
switch.toggle(); // => 'on'
```

### 2. A traffic light using timers

```javascript
import fsm from 'svelte-fsm';

const trafficLight = fsm('initial', {
  initial: { start: 'green' },

  green: {
    _enter() { trafficLight.change.debounce(20000); },
    change: 'yellow'
  },

  yellow: {
    _enter: { trafficLight.change.debounce(5000) },
    change: 'yellow'
  },

  red: {
    _enter: { trafficLight.change.debounce(20000) },
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

### 3. A form FSM with side-effects (within a Svelte component)

```svelte
<script>
  import fsm from 'svelte-fsm';

  let value, error;

  const form = fsm('entering', {
    entering: {
      submit: 'submitting'
    },

    submitting: {
      _enter() {
        const body = new URLSearchParams({value});
        fetch('https://some.endpoint', { method: 'POST', body })
          .then(form.success)
          .catch(form.error);
      },

      success(response) {
        if (response.status === '200') {
          return 'completed';
        } else {
          error = { code: response.status, message: response.statusText };
          return 'invalid';
        }
      },

      error(err) {
        error = err;
        return 'invalid';
      }
    },

    invalid: {
      input() {
        error = null;
        return 'entering';
      }
    },

    completed: {}
  });

  $: disabled = !['entering', 'invalid'].includes($form);
</script>

<form on:submit={form.submit} class:error>
  <input bind:value {disabled} on:input={form.input}>
  <button type="submit" {disabled}>Submit</button>
</form>
{#if error}{error.message}{/if}
```

## Full API

Coming soon!
