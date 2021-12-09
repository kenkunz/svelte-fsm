type BaseState = string | symbol;

type BaseAction = string;

type BaseStates<State extends BaseState = BaseState> = Record<State, BaseActions>;

type Args = any[];

type LifecycleAction = (arg: {
  from: BaseState | null;
  to: BaseState;
  event: BaseAction | null;
  args: Args;
}) => void;

type ActionFunction = BaseState | ((...args: Args) => BaseState) | ((...args: Args) => void);

type BaseActions = {
  _enter?: LifecycleAction;
  _exit?: LifecycleAction;
  [key: BaseAction]: ActionFunction;
};

type DetectFallBackState<State extends BaseState> = State extends '*' ? string : State;

type ExtractStates<States extends BaseStates> = DetectFallBackState<Exclude<keyof States, number>>;

type ExtractObjectValues<Object> = Object[keyof Object];

type GetActionFunctionMapping<Actions extends BaseActions> = {
  [Key in Exclude<keyof Actions, '_enter' | '_exit'>]: Actions[Key] extends BaseState
    ? () => Actions[Key]
    : Actions[Key];
};

type GetActionMapping<States extends BaseStates> = ExtractObjectValues<{
  [Key in keyof States]: GetActionFunctionMapping<States[Key]>;
}>;

type ExtractActions<States extends BaseStates> = GetActionMapping<States>;

type Unsubscribe = () => void;

type Subscribe<S extends BaseState> = (callback: (state: S) => void) => Unsubscribe;

type StateMachine<State extends BaseState, Actions> = {
  [Key in keyof Actions]: Actions[Key];
} & {
  subscribe: Subscribe<State>;
};

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

declare const svelteFsm: <Sts extends Readonly<BaseStates>, S extends ExtractStates<Sts>>(
  state: S,
  states: Sts
) => StateMachine<ExtractStates<Sts>, UnionToIntersection<ExtractActions<Sts>>>;

export default svelteFsm;
