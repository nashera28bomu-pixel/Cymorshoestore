import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await Settings.find();
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    await Settings.findOneAndUpdate(
      { key: req.params.key },
      { key: req.params.key, value },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
