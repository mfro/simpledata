import { DataInstance, DataModel, Json, MutationsType, loadModel, wrapMutate } from '@mfro/simpledata.common';

export async function connect<TData, TMutations extends MutationsType, TSave extends Json>(model: DataModel<TData, TMutations, TSave>, remote: string) {
  const ws = new WebSocket(remote);

  return new Promise<DataInstance<TData, TMutations, TSave>>(resolve => {
    let data: DataInstance<TData, TMutations, TSave> | null = null;
    let incoming = false;

    ws.addEventListener('message', e => {
      const msg = JSON.parse(e.data);

      if (data === null) {
        data = loadModel(model, msg)

        wrapMutate(data, (mutate, state, name, ...args) => {
          if (incoming) {
            incoming = false;
            mutate(name, ...args);
          } else {
            const update = { name, args };
            ws.send(JSON.stringify(update));
          }
        });

        resolve(data);
      } else {
        const { name, args } = msg;
        incoming = true;
        data.mutate(name, ...args);
      }
    });

    ws.addEventListener('close', () => {
      location.reload();
    });
  });
}
