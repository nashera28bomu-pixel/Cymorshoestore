import express from 'express';
import Product from '../models/Product.js';
import Waitlist from '../models/Waitlist.js';
import { upload, deleteImage } from '../utils/cloudinary.js';
import { sendMessage } from '../bot/index.js';
import { FOOTER } from '../utils/helpers.js';

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
  try {
    const { category, active } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', upload.array('images', 4), async (req, res) => {
  try {
    const { name, category, description, price, sizes, isFeatured } = req.body;

    const parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;

    const images = req.files?.map(f => ({
      url: f.path,
      publicId: f.filename
    })) || [];

    const product = new Product({
      name,
      category,
      description,
      price: Number(price),
      sizes: parsedSizes,
      images,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isActive: true
    });

    await product.save();

    // Notify waitlist if restocking
    await notifyWaitlist(product);

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update product
router.put('/:id', upload.array('images', 4), async (req, res) => {
  try {
    const { name, category, description, price, sizes, isFeatured, isActive } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const prevSizes = [...product.sizes];

    if (name) product.name = name;
    if (category) product.category = category;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (sizes) product.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
    if (isFeatured !== undefined) product.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;

    if (req.files?.length > 0) {
      const newImages = req.files.map(f => ({ url: f.path, publicId: f.filename }));
      product.images = [...product.images, ...newImages];
    }

    await product.save();

    // Check if any previously OOS sizes are now in stock
    await notifyWaitlist(product, prevSizes);

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product image
router.delete('/:id/image/:publicId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    await deleteImage(req.params.publicId);
    product.images = product.images.filter(i => i.publicId !== req.params.publicId);
    await product.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    for (const img of product.images) await deleteImage(img.publicId);
    await product.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function notifyWaitlist(product, prevSizes = []) {
  try {
    const waitlist = await Waitlist.find({
      productId: product._id.toString(),
      notified: false
    });

    for (const entry of waitlist) {
      const sizeNowInStock = product.sizes.find(
        s => s.size === entry.size && s.stock > 0
      );
      if (!sizeNowInStock) continue;

      const wasOOS = prevSizes.length === 0 ||
        prevSizes.find(s => s.size === entry.size && s.stock === 0);

      if (wasOOS || prevSizes.length === 0) {
        await sendMessage(
          `${entry.phone}@s.whatsapp.net`,
          `🎉 *Good news, ${entry.phone}!*\n\n` +
          `👟 *${product.name}* in size *${entry.size}* is back in stock!\n\n` +
          `Don't miss out — stocks are limited!\n\n` +
          `Reply *MENU* to shop now 🛍️` + FOOTER
        );
        entry.notified = true;
        await entry.save();
      }
    }
  } catch (err) {
    console.error('Waitlist notify error:', err.message);
  }
}

export default router;
