import mongoose from 'mongoose';
import { BufferJSON, initAuthCreds } from '@whiskeysockets/baileys';

// Schema to store all auth keys + creds
const authSchema = new mongoose.Schema({
  _id: { type: String },
  value: { type: mongoose.Schema.Types.Mixed }
}, { versionKey: false });

const AuthState = mongoose.models.AuthState || mongoose.model('AuthState', authSchema);

export async function useMongoDBAuthState() {
  // Helper: read a key from MongoDB
  const readData = async (id) => {
    const doc = await AuthState.findById(id).lean();
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc.value), BufferJSON.reviver);
  };

  // Helper: write a key to MongoDB
  const writeData = async (id, value) => {
    const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
    await AuthState.findByIdAndUpdate(
      id,
      { _id: id, value: serialized },
      { upsert: true, new: true }
    );
  };

  // Helper: delete a key
  const removeData = async (id) => {
    await AuthState.deleteOne({ _id: id });
  };

  // Load existing creds or create fresh ones
  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              const val = await readData(`${type}-${id}`);
              if (val) data[id] = val;
            })
          );
          return data;
        },
        set: async (data) => {
          await Promise.all(
            Object.entries(data).flatMap(([type, ids]) =>
              Object.entries(ids).map(([id, value]) =>
                value
                  ? writeData(`${type}-${id}`, value)
                  : removeData(`${type}-${id}`)
              )
            )
          );
        }
      }
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    }
  };
}
