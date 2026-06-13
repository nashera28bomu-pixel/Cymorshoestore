import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  productId: { type: String, required: true },
  productName: String,
  size: { type: String, required: true },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Waitlist', waitlistSchema);
