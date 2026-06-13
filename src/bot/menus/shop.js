import Product from '../../models/Product.js';
import Waitlist from '../../models/Waitlist.js';
import { sendMessage, sendImageMessage } from '../index.js';
import { showCategoryMenu } from './main.js';
import { FOOTER, formatCurrency } from '../../utils/helpers.js';

const CATEGORY_MAP = {
  '1': 'mens',
  '2': 'womens',
  '3': 'kids',
  '4': 'sports',
  '5': 'formal'
};

const CATEGORY_LABELS = {
  mens: '👨 Men\'s Shoes',
  womens: '👩 Women\'s Shoes',
  kids: '🧒 Kids\' Shoes',
  sports: '⚽ Sports & Sneakers',
  formal: '👔 Formal Shoes'
};

const PAGE_SIZE = 5;

export async function handleShopFlow(sock, jid, session, user, text) {
  // Selecting a category
  if (session.state === 'SHOP') {
    const category = CATEGORY_MAP[text];
    if (!category) {
      return sendMessage(jid, `⚠️ Please reply with a number *1–5* to choose a category, or *0* to go back.` + FOOTER);
    }
    session.state = 'BROWSING_CATEGORY';
    session.browsingCategory = category;
    session.browsingPage = 0;
    await session.save();
    return showProductList(jid, session, category, 0);
  }

  // Browsing a product list
  if (session.state === 'BROWSING_CATEGORY') {
    const products = await Product.find({
      category: session.browsingCategory,
      isActive: true
    });

    const totalPages = Math.ceil(products.length / PAGE_SIZE);

    if (text === 'next' || text === '>') {
      if (session.browsingPage < totalPages - 1) {
        session.browsingPage++;
        await session.save();
        return showProductList(jid, session, session.browsingCategory, session.browsingPage);
      }
    }

    if (text === 'prev' || text === '<') {
      if (session.browsingPage > 0) {
        session.browsingPage--;
        await session.save();
        return showProductList(jid, session, session.browsingCategory, session.browsingPage);
      }
    }

    if (text === '0') {
      session.state = 'SHOP';
      await session.save();
      return showCategoryMenu(sock, jid);
    }

    // User picked a product number
    const start = session.browsingPage * PAGE_SIZE;
    const paginated = products.slice(start, start + PAGE_SIZE);
    const idx = parseInt(text) - 1;

    if (isNaN(idx) || idx < 0 || idx >= paginated.length) {
      return sendMessage(jid,
        `⚠️ Please reply with a product number from the list, or *0* to go back.` + FOOTER
      );
    }

    const product = paginated[idx];
    session.state = 'BROWSING_PRODUCT';
    session.browsingProductId = product._id.toString();
    await session.save();
    return showProductDetail(jid, product);
  }

  // Viewing product detail - picking a size
  if (session.state === 'BROWSING_PRODUCT') {
    if (text === '0') {
      session.state = 'BROWSING_CATEGORY';
      await session.save();
      return showProductList(jid, session, session.browsingCategory, session.browsingPage);
    }

    const product = await Product.findById(session.browsingProductId);
    if (!product) {
      session.state = 'SHOP';
      await session.save();
      return showCategoryMenu(sock, jid);
    }

    const availableSizes = product.sizes.filter(s => s.stock > 0);
    const idx = parseInt(text) - 1;

    if (isNaN(idx) || idx < 0 || idx >= availableSizes.length) {
      // Check if they want the waitlist for an out-of-stock size
      const allSizes = product.sizes;
      const allIdx = parseInt(text) - 1;
      if (!isNaN(allIdx) && allIdx >= 0 && allIdx < allSizes.length) {
        const chosenSize = allSizes[allIdx];
        if (chosenSize.stock === 0) {
          return offerWaitlist(jid, session, product, chosenSize.size);
        }
      }
      return sendMessage(jid,
        `⚠️ Please reply with a size number from the list, or *0* to go back.` + FOOTER
      );
    }

    const chosenSize = availableSizes[idx];
    session.state = 'SELECTING_SIZE';
    session.subState = JSON.stringify({ size: chosenSize.size, productId: product._id });
    await session.save();

    return confirmAddToCart(jid, product, chosenSize.size);
  }

  // Confirming add to cart
  if (session.state === 'SELECTING_SIZE') {
    const { size, productId } = JSON.parse(session.subState || '{}');

    if (text === '1') {
      // Add to cart
      const product = await Product.findById(productId);
      if (!product) return;

      // Check if already in cart
      const existing = session.cart.find(
        i => i.productId === productId && i.size === size
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        session.cart.push({
          productId: product._id.toString(),
          productName: product.name,
          size,
          price: product.price,
          image: product.images[0]?.url || '',
          quantity: 1
        });
      }

      session.state = 'BROWSING_CATEGORY';
      session.subState = null;
      await session.save();

      await sendMessage(jid,
        `✅ *Added to Cart!*\n\n` +
        `👟 ${product.name} _(Size ${size})_\n` +
        `💰 ${formatCurrency(product.price)}\n\n` +
        `🛒 Cart total: *${session.cart.length} item${session.cart.length > 1 ? 's' : ''}*\n\n` +
        `Reply:\n` +
        `1️⃣  Continue Shopping\n` +
        `2️⃣  View Cart & Checkout\n` +
        `0️⃣  Back to Main Menu` +
        FOOTER
      );
      session.state = 'POST_ADD';
      await session.save();
      return;
    }

    if (text === '2') {
      session.state = 'SHOP';
      session.subState = null;
      await session.save();
      return showCategoryMenu(sock, jid);
    }

    return sendMessage(jid, `Reply *1* to add to cart or *2* to continue shopping.` + FOOTER);
  }

  // POST_ADD state
  if (session.state === 'POST_ADD') {
    if (text === '1') {
      session.state = 'BROWSING_CATEGORY';
      await session.save();
      return showProductList(jid, session, session.browsingCategory, session.browsingPage);
    }
    if (text === '2') {
      session.state = 'CART';
      await session.save();
      const { handleCartFlow } = await import('./cart.js');
      return handleCartFlow(sock, jid, session, user, 'view');
    }
    if (text === '0') {
      session.state = 'MAIN_MENU';
      await session.save();
      const { handleMainMenu } = await import('./main.js');
      return handleMainMenu(sock, jid, session, user, false);
    }
  }
}

async function showProductList(jid, session, category, page) {
  const products = await Product.find({ category, isActive: true });

  if (products.length === 0) {
    return sendMessage(jid,
      `😔 No products available in *${CATEGORY_LABELS[category]}* right now.\n\n` +
      `Check back soon! Reply *0* to go back.` + FOOTER
    );
  }

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const paginated = products.slice(start, start + PAGE_SIZE);

  let msg = `${CATEGORY_LABELS[category].toUpperCase()}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  paginated.forEach((p, i) => {
    const availableSizes = p.sizes.filter(s => s.stock > 0).map(s => s.size).join(', ');
    msg += `*${i + 1}.* 👟 *${p.name}*\n`;
    msg += `    💰 ${formatCurrency(p.price)}`;
    if (p.isFeatured) msg += ` ⭐ _Best Seller_`;
    msg += `\n`;
    msg += `    📐 Sizes: ${availableSizes || 'Out of stock'}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  if (totalPages > 1) {
    msg += `📄 Page ${page + 1}/${totalPages} `;
    if (page < totalPages - 1) msg += `| Reply *NEXT* for more`;
    if (page > 0) msg += `| Reply *PREV* for previous`;
    msg += `\n`;
  }
  msg += `0️⃣  🔙 Back to Categories\n\n`;
  msg += `_Reply with a product number to view details_` + FOOTER;

  await sendMessage(jid, msg);
}

async function showProductDetail(jid, product) {
  const availableSizes = product.sizes.filter(s => s.stock > 0);
  const outOfStockSizes = product.sizes.filter(s => s.stock === 0);

  let caption = `👟 *${product.name}*\n`;
  caption += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  caption += `💰 *${formatCurrency(product.price)}*`;
  if (product.isFeatured) caption += ` ⭐ _Best Seller_`;
  caption += `\n\n`;
  caption += `📝 ${product.description}\n\n`;

  if (availableSizes.length > 0) {
    caption += `✅ *Available Sizes:*\n`;
    availableSizes.forEach((s, i) => {
      caption += `  ${i + 1}. Size *${s.size}*\n`;
    });
  }

  if (outOfStockSizes.length > 0) {
    caption += `\n❌ *Out of Stock:* ${outOfStockSizes.map(s => s.size).join(', ')}\n`;
    caption += `_(Reply with out-of-stock size number to join waitlist)_\n`;
  }

  caption += `\n0️⃣  🔙 Back to List\n\n`;
  caption += `_Reply with a size number to add to cart_` + FOOTER;

  if (product.images && product.images.length > 0) {
    await sendImageMessage(jid, product.images[0].url, caption);
  } else {
    await sendMessage(jid, caption);
  }
}

async function confirmAddToCart(jid, product, size) {
  const msg =
    `🛒 *Add to Cart?*\n\n` +
    `👟 *${product.name}*\n` +
    `📐 Size: *${size}*\n` +
    `💰 ${formatCurrency(product.price)}\n\n` +
    `1️⃣  ✅ Yes, Add to Cart\n` +
    `2️⃣  🔙 Pick Different Size\n\n` +
    `_Reply 1 to confirm_` + FOOTER;

  await sendMessage(jid, msg);
}

async function offerWaitlist(jid, session, product, size) {
  await sendMessage(jid,
    `😔 *Size ${size}* is currently *out of stock* for:\n` +
    `👟 *${product.name}*\n\n` +
    `📲 Want us to *notify you* when it's back?\n\n` +
    `1️⃣  ✅ Yes, notify me!\n` +
    `2️⃣  🔙 Pick different size\n` +
    `0️⃣  Back to menu` + FOOTER
  );

  session.subState = JSON.stringify({
    waitlistProduct: product._id,
    waitlistProductName: product.name,
    waitlistSize: size,
    awaitingWaitlist: true
  });
  session.state = 'SELECTING_SIZE';
  await session.save();
}
