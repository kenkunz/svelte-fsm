# Svelte FSM

<img alt="Svelte FSM logo" align="right" src="https://user-images.githubusercontent.com/35901/145653445-72717a87-927d-4bcd-b616-aa3eb6f13cd0.png">

A tiny, simple, expressive, pramgmatic [Finite State
Machine](https://en.wikipedia.org/wiki/Finite-state_machine) (FSM) library, optimized for
[Svelte](https://svelte.dev).
* **tiny:** under `1kb` (minified); zero dependencies
* **simple:** implements core FSM features, not the kitchen sink
* **expressive:** FSM constructs are mapped to core JavaScript features (see
  [Usage Overview](#usage-overview) below)
* **pragmatic:** prioritizes developer happiness over strict adherance to FSM or Statechart
  formalizations
* **Svelte-optimized:** implements Svelte's
  [store contract](https://svelte.dev/docs#Store_contract);
  philosophically aligned – feels at-home in a Svelte codebase

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
* **states** is just an object consisting of nested `state` objects, which consist of…
  * **transitions** – property values or action return values that match another `state`
  * **actions** – functions that optionally transition (return a `state`)
* **events** are invoked on a state machine as function calls, returning the resulting state
* **timers** (often used in state machines) are available by calling `.debounce(wait)` on any event
* **context** is just… *context* (i.e., the lexical scope of your fsm)

## Next Steps

<a target="_blank" href="https://youtu.be/3_D-3HPUdEI">
<img alt="Svelte Summit video" align="right" src="https://user-images.githubusercontent.com/35901/145655001-e0b63ed8-b6cf-4729-b24c-e9b98aa30275.png">
</a>

* Watch the **[Lightning Talk](https://youtu.be/3_D-3HPUdEI)** from
  **[Svelte Summit Fall 2021](https://sveltesummit.com/)**
* Review the **[Full Documentation](https://github.com/kenkunz/svelte-fsm/wiki)**
* Check out the **[Examples](https://github.com/kenkunz/svelte-fsm/wiki/Examples)**

<br clear="all">

## Contributors

* Thank you **[@ivanhofer](https://github.com/ivanhofer)** for contributing `TypeScript`
  declarations, resulting in an improved developer experience.
* Thank you **[@morungos](https://github.com/morungos)** for contributing a fix for
  [#8](https://github.com/kenkunz/svelte-fsm/issues/8) (derived stores) by eliminating `subscribe`
  overloading.
