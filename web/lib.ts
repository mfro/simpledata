// type Json =
//   | string
//   | number
//   | boolean
//   | null
//   | Json[]
//   | { [key: string]: Json };

export interface MutationsType {
  [key: string]: any[]
};

export interface DataModelDefinition<TData, TMutations extends MutationsType> {
  init(): TData;
  mutations: MutationsDefinition<TData, TMutations>;
}

export type MutationsDefinition<TData, TMutations extends MutationsType> = {
  [K in keyof TMutations]: (data: TData, ...args: TMutations[K]) => void;
}

export function defineModel<TData, TMutations extends MutationsType>(def: DataModelDefinition<TData, TMutations>) {
  return def;
}
