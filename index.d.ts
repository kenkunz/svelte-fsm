
declare type State = string | symbol

declare type States = Record<State, Actions>

declare type LifecycleAction = (argument: { from: State, to: State, event: string, args: unknown }) => void

declare type Actions = {
	_enter?: LifecycleAction
	_exit?: LifecycleAction
	[key: string]: State | ((...args: any[]) => State) | ((...args: any[]) => void)
}

declare type ExtractStates<S extends States> = keyof S

declare type Unsubscribe = () => void

declare type Subscribe<State> = (callback: (state: State) => void) => Unsubscribe

export default function svelteFsm<S extends States>(state: ExtractStates<S>, states: S): {
	[key: string]: () => State
} & {
	subscribe: Subscribe<ExtractStates<S>>
}
