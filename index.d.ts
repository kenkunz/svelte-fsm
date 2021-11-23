
declare type State = string | symbol

declare type States = Record<State, unknown>

declare type ExtractStates<S extends States> = keyof S

export default function svelteFsm<S extends States>(state: ExtractStates<S>, states: S): any;
