import mongoose from 'mongoose';
import {
BufferJSON,
initAuthCreds,
proto
} from '@whiskeysockets/baileys';

const authSchema = new mongoose.Schema(
{
_id: {
type: String,
required: true
},
value: {
type: mongoose.Schema.Types.Mixed,
required: true
}
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
try {
const doc = await AuthState.findById(id).lean();

  if (!doc) {
    return null;
  }

  return JSON.parse(
    JSON.stringify(doc.value),
    BufferJSON.reviver
  );
} catch (error) {
  console.error(
    `❌ Failed reading auth key: ${id}`,
    error.message
  );
  return null;
}

};

const writeData = async (id, value) => {
try {
const serialized = JSON.parse(
JSON.stringify(
value,
BufferJSON.replacer
)
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
} catch (error) {
  console.error(
    `❌ Failed writing auth key: ${id}`,
    error.message
  );
}

};

const removeData = async (id) => {
try {
await AuthState.deleteOne({
_id: id
});
} catch (error) {
console.error(
"❌ Failed deleting auth key: ${id}",
error.message
);
}
};

const creds =
(await readData('creds')) ||
initAuthCreds();

console.log(
'📦 Auth State Loaded:',
creds?.registered || false
);

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
try {
await writeData(
'creds',
state.creds
);

  console.log(
    '💾 WhatsApp credentials saved'
  );
} catch (error) {
  console.error(
    '❌ Failed saving credentials',
    error.message
  );
}

};

return {
state,
saveCreds
};
}
