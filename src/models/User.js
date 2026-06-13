import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: null },
  isReturning: { type: Boolean, default: false },
  totalOrders: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
