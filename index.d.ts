
declare type State = string | symbol

declare type Action = string

declare type States<S extends State = State> = Record<S, Actions>

declare type Args = any[]

declare type LifecycleAction = (arg: { from: State, to: State, event: Action, args: Args }) => void

declare type ActionFunction = State | ((...args: Args) => State) | ((...args: Args) => void)

declare type Actions = {
	_enter?: LifecycleAction
	_exit?: LifecycleAction
	[key: Action]: ActionFunction
}

type DetectFallBackState<X extends string | symbol> = X extends '*' ? string : X

declare type ExtractStates<Sts extends States> = DetectFallBackState<Exclude<keyof Sts, number>>

type ExtractObjectValues<A> = A[keyof A]

type GetActionFunctionMapping<A extends Record<Action, ActionFunction>> = {
	[Key in Exclude<keyof A, '_enter' | '_exit'>]: A[Key] extends string ? () => A[Key] : A[Key]
}

type GetActionMapping<A extends Record<State, Actions>> = ExtractObjectValues<{
	[Key in keyof A]: GetActionFunctionMapping<A[Key]>
}>

declare type ExtractActions<Sts extends States> = GetActionMapping<Sts>

declare type Unsubscribe = () => void

declare type Subscribe<S> = (callback: (state: S) => void) => Unsubscribe

type StateMachine<S extends State, A> = {
	[key in keyof A]: A[key]
} & {
	subscribe: Subscribe<S>
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

declare const svelteFsm: <Sts extends States, S extends ExtractStates<Sts>>(state: S, states: Sts) => StateMachine<ExtractStates<Sts>, UnionToIntersection<ExtractActions<Sts>>>

export default svelteFsm
