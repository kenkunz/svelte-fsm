
declare type State = string | symbol | number

declare type Action = string

declare type States<S extends State = State> = Record<S, Actions>

declare type Args = any[]

declare type LifecycleAction = (arg: { from: State, to: State, event: Action, args: Args }) => void

declare type Actions = {
	_enter?: LifecycleAction
	_exit?: LifecycleAction
	[key: string]: State | ((...args: Args) => State) | ((...args: Args) => void)
}

declare type ExtractStates<Sts extends States> = keyof Sts

type ExtractObjectValues<A> = A[keyof A]

type GetActionMapping<A extends Record<any, any>> = ExtractObjectValues<{
	[a in keyof A]: keyof A[a]
}>

declare type ExtractActions<Sts extends States> = Exclude<GetActionMapping<Sts>, '_enter' | '_exit' | number | Symbol>

declare type Unsubscribe = () => void

declare type Subscribe<S> = (callback: (state: S) => void) => Unsubscribe

type StateMachine<S extends State, A extends string> = {
	[key in A]?: (...args: Args) => S // TODO: check if actions are really optional
} & {
	subscribe: Subscribe<S>
}

declare const svelteFsm: <Sts extends States, S extends ExtractStates<Sts>>(state: S, states: Sts) => StateMachine<ExtractStates<Sts>, ExtractActions<Sts>>

export default svelteFsm
