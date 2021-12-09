# svelte-fsm changelog

## 1.1.0

- **[feat]** improve TypeScript declarations ([#1](https://github.com/kenkunz/svelte-fsm/pull/1))
- **[fix]** allow `symbol` transition values

## 1.0.0

- cancel pending `debounce` invocations by calling `debounce(null)`

## 0.7.1

- ignore non-`string` transition values
- improve tests - more readable, less fragile

## 0.7.0

- call lifecycle actions (`_enter`, `_exit`) with transition metadata `{ from, to, event, args }`
- remove `_init` lifecycle action; call `_enter` on-init with `null` valued `from` and `event`
- add support for `'*'` pseudo-state fallback actions
- bind `this` to state object in action invocations
