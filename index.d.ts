
declare type State = string | symbol | number

declare type Action = string

declare type States<S extends State = State> = Record<S, Actions>

declare type Args = any[]

declare type LifecycleAction = (arg: { from: State, to: State, event: Action, args: Args }) => void

declare type ActionFunction = State | ((...args: Args) => State) | ((...args: Args) => void)

declare type Actions = {
	_enter?: LifecycleAction
	_exit?: LifecycleAction
	[key: string]: ActionFunction
}

declare type ExtractStates<Sts extends States> = keyof Sts

type ExtractObjectValues<A> = A[keyof A]

type GetActionMapping<A extends Record<State, Actions>> = ExtractObjectValues<{
	[key in keyof A]: A[key] extends State ? () => A[key] : A[key] // TODO: make if-condition work
}>

declare type ExtractActions<Sts extends States> = Exclude<GetActionMapping<Sts>, '_enter' | '_exit' | number | Symbol>

declare type Unsubscribe = () => void

declare type Subscribe<S> = (callback: (state: S) => void) => Unsubscribe

type StateMachine<S extends State, A> = {
	[key in keyof A]?: A[key] // TODO: check if actions are really optional
} & {
	subscribe: Subscribe<S>
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

declare const svelteFsm: <Sts extends States, S extends ExtractStates<Sts>>(state: S, states: Sts) => StateMachine<ExtractStates<Sts>, UnionToIntersection<ExtractActions<Sts>>>

export default svelteFsm
