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

export interface DataModelDefinition<TData, TMutations extends MutationsType, TSave extends Json> {
  init(): TData;
  save(data: TData): TSave;
  load(save: TSave): TData;
  mutations: MutationsDefinition<TData, TMutations>;
}

export type MutationsDefinition<TData, TMutations extends MutationsType> = {
  [K in keyof TMutations]: (data: TData, ...args: TMutations[K]) => void;
}

export function defineModel<TData extends Json, TMutations extends MutationsType>(def: DataModelDefinition<TData, TMutations, TData>): DataModelDefinition<TData, TMutations, TData>;
export function defineModel<TData, TMutations extends MutationsType, TSave extends Json>(def: DataModelDefinition<TData, TMutations, TSave>): DataModelDefinition<TData, TMutations, TSave>;
export function defineModel<TData, TMutations extends MutationsType, TSave extends Json>(def: DataModelDefinition<TData, TMutations, TSave>) {
  return def;
}
