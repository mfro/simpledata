import path from 'path';
import { promises as fs } from 'fs';

import WebSocket from 'ws';
import { assert } from '@mfro/ts-common/assert';
import { DataModelDefinition, Json, MutationsType } from '@mfro/simpledata.common';

const dataDir = 'data';
const active = new Map<string, StateEntry>();

interface StateEntry {
  data: any;
  sockets: Set<WebSocket>;
}

interface Update {
  name: string;
  args: any[];
}

async function loadFile<TData, TMutations extends MutationsType, TSave extends Json>(filePath: string, model: DataModelDefinition<TData, TMutations, TSave>) {
  const raw = await fs.readFile(filePath);
  const str = raw.toString('utf8');
  const json = JSON.parse(str);
  return model.load(json);
}

async function saveFile<TData, TMutations extends MutationsType, TSave extends Json>(filePath: string, model: DataModelDefinition<TData, TMutations, TSave>, value: TData) {
  const json = model.save(value);
  const str = JSON.stringify(json, undefined, '  ');
  const raw = Buffer.from(str, 'utf8');
  await fs.writeFile(filePath, raw);
}

export function host<TData, TMutations extends MutationsType, TSave extends Json>(model: DataModelDefinition<TData, TMutations, TSave>, server: WebSocket.Server) {
  server.on('connection', async (socket, request) => {
    assert(request.url != null, 'url');

    assert(request.url[0] == '/', 'url');
    const code = request.url.slice(1);
    assert(/^[\w-]+$/.test(code), 'url');
    const filePath = path.join(dataDir, code);

    let state = active.get(code);
    try {
      if (!state) active.set(code, state = {
        data: await loadFile(filePath, model),
        sockets: new Set,
      });
    } catch (e) {
      console.log(`error: ${code} ${e}`)
      return socket.close();
    }

    state.sockets.add(socket);
    socket.send(JSON.stringify(model.save(state.data)));

    socket.on('message', async data => {
      assert(state != null, 'state');
      assert(typeof data == 'string', 'data');

      const update: Update = JSON.parse(data);

      model.mutations[update.name](state.data, ...update.args as any);

      for (const other of state.sockets) {
        other.send(data);
      }

      await saveFile(filePath, model, state.data)
    });

    socket.on('close', e => {
      assert(state != null, 'state');

      state.sockets.delete(socket);
      if (state.sockets.size == 0) {
        active.delete(code);
      }
    });
  });
}
