import mongoose from 'mongoose';

const sizeStockSchema = new mongoose.Schema({
  size: { type: String, required: true },
  stock: { type: Number, default: 0 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['mens', 'womens', 'kids', 'sports', 'formal'],
    required: true
  },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ url: String, publicId: String }],
  sizes: [sizeStockSchema],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  totalSold: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Product', productSchema);
