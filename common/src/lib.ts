export interface DataInstance<TState, TMutations extends MutationsType, TSave> {
  model: DataModelDefinition<TState, TMutations, TSave>;
  state: TState;
  mutate<K extends keyof TMutations>(name: K, ...args: TMutations[K]): void;
}

export type DataModel<TState, TMutations extends MutationsType, TSave>
  = DataModelDefinition<TState, TMutations, TSave>;

export type DataInstanceFrom<T> = T extends DataModel<infer TState, infer TMutations, infer TSave>
  ? DataInstance<TState, TMutations, TSave>
  : never;

export interface MutationsType {
  [key: string]: any[]
};

export interface BaseDefinition<TState, TSave> {
  init(): TState;

  save(data: TState): TSave;
  load(save: TSave): TState;
}

export type MutationsDefinition<TState, TMutations extends MutationsType> = {
  [K in keyof TMutations]: (data: TState, ...args: TMutations[K]) => void;
}

export interface DataModelDefinition<TState, TMutations extends MutationsType, TSave> {
  init(): TState;
  save(data: TState): TSave;
  load(save: TSave): TState;
  mutations: MutationsDefinition<TState, TMutations>;
}

export function defineModel<TState, TSave>(
  def: BaseDefinition<TState, TSave>
) {
  return def;
}

export function defineMutations<TState, TSave, TMutations extends MutationsType>(
  base: BaseDefinition<TState, TSave>,
  mutations: MutationsDefinition<TState, TMutations>
) {
  return mutations;
}

export function buildModel<TState, TSave, TMutations extends MutationsType>(
  base: BaseDefinition<TState, TSave>,
  mutations: MutationsDefinition<TState, TMutations>,
): DataModelDefinition<TState, TMutations, TSave> {
  return {
    ...base,
    mutations,
  };
}

export function startModel<TState, TMutations extends MutationsType, TSave>(
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

export function initModel<TState, TMutations extends MutationsType, TSave>(
  model: DataModel<TState, TMutations, TSave>,
): DataInstanceFrom<typeof model> {
  const state = model.init();
  return startModel(model, state);
}

export function loadModel<TState, TMutations extends MutationsType, TSave>(
  model: DataModel<TState, TMutations, TSave>,
  saved: TSave,
): DataInstanceFrom<typeof model> {
  const state = model.load(saved);
  return startModel(model, state);
}

export function wrapMutate<TState, TMutations extends MutationsType, TSave>(
  data: DataInstance<TState, TMutations, TSave>,
  callback: <K extends keyof TMutations>(inner: typeof data.mutate, state: TState, name: K, ...args: TMutations[K]) => void,
) {
  const original = data.mutate;
  data.mutate = (name, ...args) => {
    callback(original, data.state, name, ...args);
  };
}
