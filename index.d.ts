
declare type State = string | symbol

declare type States = Record<State, StateDescription>

declare type StateDescription = {
	[key: string]: State | ((...args: any[]) => State | void)
}

declare type ExtractStates<S extends States> = keyof S

declare type Unsubscribe = () => void

declare type Subscribe<State> = (callback: (state: State) => void) => Unsubscribe

export default function svelteFsm<S extends States>(state: ExtractStates<S>, states: S): {
	[key: string]: () => State
} & {
	subscribe: Subscribe<ExtractStates<S>>
}
