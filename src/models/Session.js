import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  size: String,
  price: Number,
  image: String,
  quantity: { type: Number, default: 1 }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  state: { type: String, default: 'IDLE' },
  subState: { type: String, default: null },
  cart: { type: [cartItemSchema], default: [] },
  checkoutData: {
    name: String,
    county: String,
    address: String,
    mpesaPhone: String,
    deliveryFee: Number
  },
  pendingPayment: {
    checkoutRequestId: String,
    merchantRequestId: String,
    amount: Number,
    orderId: String
  },
  browsingCategory: { type: String, default: null },
  browsingProductId: { type: String, default: null },
  browsingPage: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  abandonmentNotified: { type: Boolean, default: false }
});

sessionSchema.index({ lastActive: 1 });

export default mongoose.model('Session', sessionSchema);
