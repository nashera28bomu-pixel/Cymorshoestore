import mongoose from 'mongoose';
import {
BufferJSON,
initAuthCreds,
proto
} from '@whiskeysockets/baileys';

const authSchema = new mongoose.Schema(
{
_id: String,
value: mongoose.Schema.Types.Mixed
},
{
versionKey: false
}
);

const AuthState =
mongoose.models.AuthState ||
mongoose.model('AuthState', authSchema);

export async function useMongoDBAuthState() {
const readData = async (id) => {
const doc = await AuthState.findById(id).lean();

if (!doc) {
  return null;
}

return JSON.parse(
  JSON.stringify(doc.value),
  BufferJSON.reviver
);

};

const writeData = async (id, value) => {
const serialized = JSON.parse(
JSON.stringify(value, BufferJSON.replacer)
);

await AuthState.findOneAndUpdate(
  { _id: id },
  {
    _id: id,
    value: serialized
  },
  {
    upsert: true,
    new: true
  }
);

};

const removeData = async (id) => {
await AuthState.deleteOne({ _id: id });
};

const creds =
(await readData('creds')) ||
initAuthCreds();

const state = {
creds,

keys: {
  get: async (type, ids) => {
    const data = {};

    await Promise.all(
      ids.map(async (id) => {
        let value = await readData(
          `${type}-${id}`
        );

        if (
          value &&
          type === 'app-state-sync-key'
        ) {
          value =
            proto.Message.AppStateSyncKeyData.fromObject(
              value
            );
        }

        data[id] = value;
      })
    );

    return data;
  },

  set: async (data) => {
    const tasks = [];

    for (const category in data) {
      for (const id in data[category]) {
        const value =
          data[category][id];

        const key =
          `${category}-${id}`;

        tasks.push(
          value
            ? writeData(key, value)
            : removeData(key)
        );
      }
    }

    await Promise.all(tasks);
  }
}

};

const saveCreds = async () => {
await writeData(
'creds',
state.creds
);
};

return {
state,
saveCreds
};
}
