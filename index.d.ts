
declare type State = string | symbol

declare type States = Record<State, StateDescription>

declare type StateDescription = {
	[key: string]: State | (() => State)
}

declare type ExtractStates<S extends States> = keyof S

export default function svelteFsm<S extends States>(state: ExtractStates<S>, states: S): any
