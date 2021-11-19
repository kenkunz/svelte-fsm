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

## Quick Start

### Installation

```bash
npm install svelte-fsm
```

### Create your first FSM and use it in a Svelte component

```svelte
<script>
  import fsm from 'svelte-fsm';

  const simpleSwitch = fsm('off', {
    off: { toggle: 'on' },
    on: { toggle: 'off' }
  });
</script>

<button value={$simpleSwitch} on:click={simpleSwitch.toggle}>
  {$simpleSwitch}
</button>
```

## Usage Overview

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
* **context** is just… *context* (i.e., the lexical scope of your fsm)

## Next Steps

* **[Full Documentation](https://github.com/kenkunz/svelte-fsm/wiki)**
* **[Examples](https://github.com/kenkunz/svelte-fsm/wiki/Examples)**
