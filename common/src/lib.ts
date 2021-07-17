export interface DataInstance<TState, TMutations extends MutationsType, TSave extends Json> {
  model: DataModelDefinition<TState, TMutations, TSave>;
  state: TState;
  mutate<K extends keyof TMutations>(name: K, ...args: TMutations[K]): void;
}

export type DataModel<TState, TMutations extends MutationsType, TSave extends Json>
  = DataModelDefinition<TState, TMutations, TSave>;

export type DataInstanceFrom<T> = T extends DataModel<infer TState, infer TMutations, infer TSave>
  ? DataInstance<TState, TMutations, TSave>
  : never;

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export interface MutationsType {
  [key: string]: any[]
};

export interface DataModelDefinition<TState, TMutations extends MutationsType, TSave extends Json> {
  init(): TState;
  save(data: TState): TSave;
  load(save: TSave): TState;
  mutations: MutationsDefinition<TState, TMutations>;
}

export type MutationsDefinition<TState, TMutations extends MutationsType> = {
  [K in keyof TMutations]: (data: TState, ...args: TMutations[K]) => void;
}

export function defineModel<TState extends Json, TMutations extends MutationsType>(
  def: DataModelDefinition<TState, TMutations, TState>
): DataModel<TState, TMutations, TState>;

export function defineModel<TState, TMutations extends MutationsType, TSave extends Json>(
  def: DataModelDefinition<TState, TMutations, TSave>
): DataModel<TState, TMutations, TSave>;

export function defineModel<TState, TMutations extends MutationsType, TSave extends Json>(
  def: DataModelDefinition<TState, TMutations, TSave>
) {
  return def;
}

export function startModel<TState, TMutations extends MutationsType, TSave extends Json>(
  model: DataModel<TState, TMutations, TSave>,
  state: TState,
): DataInstanceFrom<typeof model> {
  const data: DataInstanceFrom<typeof model> = {
    model,
    state,
    mutate(name, ...args) {
      const mutation = data.model.mutations[name];
      mutation(data.state, ...args);
    },
  };

  return data;
}

export function initModel<TState, TMutations extends MutationsType, TSave extends Json>(
  model: DataModel<TState, TMutations, TSave>,
): DataInstanceFrom<typeof model> {
  const state = model.init();
  return startModel(model, state);
}

export function loadModel<TState, TMutations extends MutationsType, TSave extends Json>(
  model: DataModel<TState, TMutations, TSave>,
  saved: TSave,
): DataInstanceFrom<typeof model> {
  const state = model.load(saved);
  return startModel(model, state);
}

export function wrapMutate<TState, TMutations extends MutationsType, TSave extends Json>(
  data: DataInstance<TState, TMutations, TSave>,
  callback: <K extends keyof TMutations>(inner: typeof data.mutate, state: TState, name: K, ...args: TMutations[K]) => void,
) {
  const original = data.mutate;
  data.mutate = (name, ...args) => {
    callback(original, data.state, name, ...args);
  };
}
