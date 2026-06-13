import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  size: String,
  price: Number,
  quantity: Number,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customer: {
    phone: { type: String, required: true },
    name: { type: String, required: true }
  },
  items: [orderItemSchema],
  delivery: {
    county: String,
    address: String,
    fee: Number
  },
  subtotal: Number,
  total: Number,
  mpesaRef: { type: String, default: null },
  mpesaPhone: String,
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Order', orderSchema);
