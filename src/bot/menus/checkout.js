import Order from '../../models/Order.js';
import { sendMessage, sendImageMessage } from '../index.js';
import { initiateSTKPush } from '../../utils/daraja.js';
import { generateOrderId, formatCurrency, formatDate, FOOTER } from '../../utils/helpers.js';
import { COUNTIES, getCountyById } from '../../utils/counties.js';

export async function handleCheckoutFlow(sock, jid, session, user, text) {
  const phone = jid.replace('@s.whatsapp.net', '');

  // Start checkout
  if (text === 'start' || session.state === 'CHECKOUT') {
    session.state = 'AWAITING_NAME';
    session.checkoutData = {};
    await session.save();

    const greeting = user.name ? `Great, *${user.name}*!` : `Let's get your order sorted!`;

    return sendMessage(jid,
      `📋 *CHECKOUT*\n\n` +
      `${greeting}\n\n` +
      `*Step 1 of 4:* 👤 Your Name\n\n` +
      `Please enter your *full name* for delivery:\n\n` +
      `_(e.g. James Mwangi)_\n\n` +
      `Reply *0* to go back to cart.` + FOOTER
    );
  }

  // Step 1: Name
  if (session.state === 'AWAITING_NAME') {
    if (text === '0') {
      session.state = 'CART';
      session.subState = 'VIEWING';
      await session.save();
      const { showCart } = await import('./cart.js');
      return showCart(jid, session);
    }

    if (text.length < 2 || text.length > 50) {
      return sendMessage(jid, `⚠️ Please enter a valid full name (2–50 characters).` + FOOTER);
    }

    session.checkoutData.name = text
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    // Save name to user profile
    user.name = session.checkoutData.name;
    await user.save();

    session.state = 'AWAITING_COUNTY';
    await session.save();

    // Show counties in pages of 10
    return showCountyPage(jid, 0);
  }

  // Step 2: County selection
  if (session.state === 'AWAITING_COUNTY') {
    if (text === '0') {
      session.state = 'AWAITING_NAME';
      await session.save();
      return sendMessage(jid,
        `*Step 1 of 4:* 👤 Your Name\n\nPlease enter your full name:` + FOOTER
      );
    }

    if (text === 'next') return showCountyPage(jid, 1);
    if (text === 'prev') return showCountyPage(jid, 0);

    const county = getCountyById(text);
    if (!county) {
      return sendMessage(jid,
        `⚠️ Invalid county number. Please reply with a number from the list, or type *NEXT* for more.` + FOOTER
      );
    }

    session.checkoutData.county = county.name;
    session.checkoutData.deliveryFee = county.fee;
    session.state = 'AWAITING_ADDRESS';
    await session.save();

    return sendMessage(jid,
      `✅ Delivering to *${county.name}*\n` +
      `🚚 Delivery fee: *${formatCurrency(county.fee)}*\n\n` +
      `*Step 3 of 4:* 📍 Delivery Address\n\n` +
      `Please enter your detailed delivery address:\n\n` +
      `_(e.g. Westlands, Mama Ngina Street, Sarit Centre, 2nd Floor)_\n\n` +
      `Reply *0* to change county.` + FOOTER
    );
  }

  // Step 3: Address
  if (session.state === 'AWAITING_ADDRESS') {
    if (text === '0') {
      session.state = 'AWAITING_COUNTY';
      await session.save();
      return showCountyPage(jid, 0);
    }

    if (text.length < 5) {
      return sendMessage(jid,
        `⚠️ Address too short. Please be more specific so we can find you easily!` + FOOTER
      );
    }

    session.checkoutData.address = text;
    session.state = 'AWAITING_CONFIRM';
    await session.save();

    return showOrderSummary(jid, session);
  }

  // Step 4: Order confirmation
  if (session.state === 'AWAITING_CONFIRM') {
    if (text === '2') {
      // Edit - go back
      session.state = 'AWAITING_NAME';
      await session.save();
      return sendMessage(jid,
        `Let's update your details.\n\n*Step 1 of 4:* 👤 Your Name\n\nEnter your full name:` + FOOTER
      );
    }

    if (text !== '1') {
      return sendMessage(jid,
        `Reply *1* to confirm your order or *2* to edit details.` + FOOTER
      );
    }

    // Confirmed - ask for M-Pesa number
    session.state = 'AWAITING_MPESA_PHONE';
    await session.save();

    return sendMessage(jid,
      `💳 *MPESA PAYMENT*\n\n` +
      `*Step 4 of 4:* Enter your M-Pesa number\n\n` +
      `📱 Type your Safaricom number:\n` +
      `_(e.g. 0712345678 or 254712345678)_\n\n` +
      `This number will receive the *STK Push prompt*.\n\n` +
      `Reply *0* to go back.` + FOOTER
    );
  }

  // Step 5: M-Pesa number
  if (session.state === 'AWAITING_MPESA_PHONE') {
    if (text === '0') {
      session.state = 'AWAITING_CONFIRM';
      await session.save();
      return showOrderSummary(jid, session);
    }

    const cleaned = text.replace(/\D/g, '');
    const validPhone =
      (cleaned.startsWith('07') && cleaned.length === 10) ||
      (cleaned.startsWith('01') && cleaned.length === 10) ||
      (cleaned.startsWith('2547') && cleaned.length === 12) ||
      (cleaned.startsWith('2541') && cleaned.length === 12);

    if (!validPhone) {
      return sendMessage(jid,
        `⚠️ Invalid phone number. Please enter a valid Safaricom number.\n\n` +
        `_(e.g. 0712345678)_` + FOOTER
      );
    }

    session.checkoutData.mpesaPhone = cleaned;
    session.state = 'AWAITING_PAYMENT';

    const subtotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + session.checkoutData.deliveryFee;
    const orderId = await generateOrderId();

    session.pendingPayment = {
      amount: total,
      orderId
    };
    await session.save();

    await sendMessage(jid,
      `⏳ *Initiating M-Pesa payment...*\n\n` +
      `💰 Amount: *${formatCurrency(total)}*\n` +
      `📱 To: *${cleaned}*\n\n` +
      `Please wait...` + FOOTER
    );

    try {
      const stkRes = await initiateSTKPush(cleaned, total, orderId);

      if (stkRes.ResponseCode === '0') {
        session.pendingPayment.checkoutRequestId = stkRes.CheckoutRequestID;
        session.pendingPayment.merchantRequestId = stkRes.MerchantRequestID;
        await session.save();

        await sendMessage(jid,
          `✅ *STK Push Sent!*\n\n` +
          `📱 Check your phone *${cleaned}* for the M-Pesa prompt.\n\n` +
          `💰 Amount: *${formatCurrency(total)}*\n\n` +
          `⚠️ *Do NOT close WhatsApp* — your order will confirm automatically once payment is complete.\n\n` +
          `_If you don't see the prompt, reply *RETRY* to resend._` + FOOTER
        );
      } else {
        throw new Error(stkRes.ResponseDescription || 'STK Push failed');
      }
    } catch (err) {
      console.error('STK Push error:', err.message);
      session.state = 'AWAITING_MPESA_PHONE';
      session.pendingPayment = null;
      await session.save();

      await sendMessage(jid,
        `❌ *Payment initiation failed.*\n\n` +
        `Error: ${err.message}\n\n` +
        `Please check your M-Pesa number and try again.\n` +
        `Reply *RETRY* to try again or *0* to go back.` + FOOTER
      );
    }
    return;
  }

  // Awaiting payment confirmation
  if (session.state === 'AWAITING_PAYMENT') {
    if (text === 'retry' || text === 'resend') {
      session.state = 'AWAITING_MPESA_PHONE';
      await session.save();
      return sendMessage(jid,
        `💳 Enter your M-Pesa number to try again:\n_(e.g. 0712345678)_` + FOOTER
      );
    }

    return sendMessage(jid,
      `⏳ *Waiting for payment confirmation...*\n\n` +
      `Please complete the M-Pesa prompt on your phone.\n\n` +
      `Once paid, your order will be confirmed automatically! 🎉` + FOOTER
    );
  }
}

export async function confirmOrderAfterPayment(phone, mpesaRef, checkoutRequestId) {
  const Session = (await import('../../models/Session.js')).default;
  const session = await Session.findOne({ phone });

  if (!session || session.state !== 'AWAITING_PAYMENT') return;
  if (session.pendingPayment?.checkoutRequestId !== checkoutRequestId) return;

  const { sendMessage: sm, sendImageMessage: sImg } = await import('../index.js');
  const jid = `${phone}@s.whatsapp.net`;

  try {
    const subtotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + (session.checkoutData.deliveryFee || 0);

    const order = new Order({
      orderId: session.pendingPayment.orderId,
      customer: {
        phone,
        name: session.checkoutData.name
      },
      items: session.cart.map(i => ({
        productId: i.productId,
        productName: i.productName,
        size: i.size,
        price: i.price,
        quantity: i.quantity,
        image: i.image
      })),
      delivery: {
        county: session.checkoutData.county,
        address: session.checkoutData.address,
        fee: session.checkoutData.deliveryFee
      },
      subtotal,
      total,
      mpesaRef,
      mpesaPhone: session.checkoutData.mpesaPhone,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', note: 'Payment received via M-Pesa' }]
    });

    await order.save();

    // Update product stock
    const Product = (await import('../../models/Product.js')).default;
    for (const item of session.cart) {
      await Product.updateOne(
        { _id: item.productId, 'sizes.size': item.size },
        {
          $inc: {
            'sizes.$.stock': -item.quantity,
            totalSold: item.quantity
          }
        }
      );
    }

    // Update user
    const User = (await import('../../models/User.js')).default;
    await User.updateOne({ phone }, { $inc: { totalOrders: 1 } });

    // Clear session
    session.cart = [];
    session.state = 'MAIN_MENU';
    session.subState = null;
    session.pendingPayment = null;
    session.checkoutData = {};
    await session.save();

    // Receipt to customer
    let receipt =
      `🎉 *ORDER CONFIRMED!*\n\n` +
      `📋 Order: *${order.orderId}*\n` +
      `💳 M-Pesa Ref: *${mpesaRef}*\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *${order.customer.name}*\n`;

    order.items.forEach(item => {
      receipt += `👟 ${item.productName} _(Sz ${item.size})_ x${item.quantity} — ${formatCurrency(item.price * item.quantity)}\n`;
    });

    receipt +=
      `\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 Subtotal: ${formatCurrency(subtotal)}\n` +
      `🚚 Delivery: ${formatCurrency(order.delivery.fee)}\n` +
      `💰 *TOTAL PAID: ${formatCurrency(total)}*\n\n` +
      `📍 *Delivery to:*\n${order.delivery.county}\n${order.delivery.address}\n\n` +
      `📅 Est. Delivery: *2–5 business days*\n\n` +
      `📦 Track your order anytime:\nReply *TRACK ${order.orderId}*\n\n` +
      `Thank you for shopping at *SOLEZ KE* 👟🙏` +
      FOOTER;

    await sm(jid, receipt);

    // Invoice to owner
    const ownerPhone = process.env.OWNER_PHONE;
    if (ownerPhone) {
      let invoice =
        `🔔 *NEW ORDER — ${order.orderId}*\n\n` +
        `👤 *Customer:* ${order.customer.name}\n` +
        `📱 *Phone:* ${order.customer.phone}\n` +
        `💳 *M-Pesa Ref:* ${mpesaRef}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛍️ *ITEMS ORDERED:*\n`;

      order.items.forEach(item => {
        invoice += `• ${item.productName} (Sz ${item.size}) x${item.quantity} — ${formatCurrency(item.price * item.quantity)}\n`;
      });

      invoice +=
        `\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🚚 *Deliver to:*\n${order.delivery.county}\n${order.delivery.address}\n\n` +
        `💰 *Total Paid: ${formatCurrency(total)}*\n` +
        `📅 *Ordered:* ${formatDate(new Date())}\n\n` +
        `⚡ Update order status from the admin dashboard.` +
        FOOTER;

      await sm(`${ownerPhone}@s.whatsapp.net`, invoice);
    }

  } catch (err) {
    console.error('Order confirmation error:', err.message);
    await sm(jid,
      `⚠️ Payment received but there was an issue saving your order.\n\n` +
      `Please contact support with your M-Pesa ref: *${mpesaRef}*\n` +
      `We will sort this out immediately!` + FOOTER
    );
  }
}

async function showOrderSummary(jid, session) {
  const subtotal = session.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = session.checkoutData.deliveryFee || 0;
  const total = subtotal + deliveryFee;

  let msg =
    `📋 *ORDER SUMMARY*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Name:* ${session.checkoutData.name}\n` +
    `📍 *County:* ${session.checkoutData.county}\n` +
    `🏠 *Address:* ${session.checkoutData.address}\n\n` +
    `🛍️ *Items:*\n`;

  session.cart.forEach(item => {
    msg += `  • ${item.productName} _(Sz ${item.size})_ x${item.quantity} — ${formatCurrency(item.price * item.quantity)}\n`;
  });

  msg +=
    `\n━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🧾 Subtotal: *${formatCurrency(subtotal)}*\n` +
    `🚚 Delivery: *${formatCurrency(deliveryFee)}*\n` +
    `💰 *TOTAL: ${formatCurrency(total)}*\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `1️⃣  ✅ *Confirm & Pay with M-Pesa*\n` +
    `2️⃣  ✏️  *Edit Details*\n\n` +
    `_Reply 1 to proceed to payment_` + FOOTER;

  await sendMessage(jid, msg);
}

async function showCountyPage(jid, page) {
  const perPage = 10;
  const start = page * perPage;
  const counties = COUNTIES.slice(start, start + perPage);
  const totalPages = Math.ceil(COUNTIES.length / perPage);

  let msg = `*Step 2 of 4:* 📍 Select Your County\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  counties.forEach(c => {
    msg += `*${c.id}.* ${c.name} — _${formatCurrency(c.fee)} delivery_\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📄 Page ${page + 1}/${totalPages}\n`;
  if (page < totalPages - 1) msg += `Reply *NEXT* for more counties\n`;
  if (page > 0) msg += `Reply *PREV* for previous\n`;
  msg += `\n_Reply with your county number_` + FOOTER;

  await sendMessage(jid, msg);
}
