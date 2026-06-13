# 👟 SOLEZ KE — WhatsApp Business Bot

> *Step Into Your Story* · Powered by CymorTech Services

A full-featured WhatsApp business bot for a shoe store, with M-Pesa payments, order tracking, and an admin dashboard.

---

## 🚀 Features

- **WhatsApp Bot** (Baileys) — 24/7 automated customer service
- **Full Shopping Flow** — Browse by category, view products with images, pick sizes, cart system
- **M-Pesa STK Push** — Daraja API sandbox/production payments
- **Order Management** — Auto receipts to customer, invoice to owner
- **Order Tracking** — Real-time status updates via WhatsApp
- **Cart Abandonment** — Auto reminder after 30 minutes
- **Returning Customer Detection** — Personalized welcome messages
- **Waitlist System** — Notify customers when out-of-stock sizes return
- **Admin Dashboard** — Full web UI for orders, products, revenue stats
- **Countrywide Delivery** — All 47 Kenyan counties with dynamic fees

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Bot | @whiskeysockets/baileys |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Media | Cloudinary |
| Payments | Daraja API (M-Pesa) |
| Admin UI | Vanilla HTML/CSS/JS |
| Hosting | Render (free tier) |

---

## ⚙️ Setup

### 1. Clone & Install
```bash
git clone https://github.com/youruser/solez-ke.git
cd solez-ke
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in all values:
```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) — free M0 cluster |
| `CLOUDINARY_*` | [Cloudinary Console](https://cloudinary.com) |
| `MPESA_CONSUMER_KEY/SECRET` | [Daraja Portal](https://developer.safaricom.co.ke) — sandbox app |
| `MPESA_CALLBACK_URL` | Your Render URL + `/api/mpesa/callback` |
| `OWNER_PHONE` | Your WhatsApp number (254XXXXXXXXX format) |
| `ADMIN_PASSWORD` | Choose a strong password |
| `JWT_SECRET` | Any random string |

### 3. Run Locally
```bash
npm run dev
```
Scan the QR code in terminal with WhatsApp to connect the bot.

---

## 📱 Deploying to Render

1. Push code to GitHub
2. Create new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Set all environment variables from `.env`
5. Build command: `npm install`
6. Start command: `node server.js`

> ⚠️ **Important:** On first deploy, check Render logs for the QR code. Scan it once. After that the session persists in `.baileys-auth/` (saved in Render's disk or you can use MongoDB for auth state).

### Keeping Bot Alive on Render Free Tier
Render free tier sleeps after 15 mins of inactivity. To prevent this:
- Use [UptimeRobot](https://uptimerobot.com) to ping `https://your-app.onrender.com/health` every 14 minutes (free).

---

## 🖥️ Admin Dashboard

Access at: `https://your-app.onrender.com`

Login with your `ADMIN_PASSWORD`.

**Features:**
- 📊 Revenue & order stats
- 📦 Order management with status updates (auto-notifies customer on WhatsApp)
- 👟 Product management (add/edit/delete with image upload)
- 👥 Customer overview

---

## 💳 M-Pesa Setup (Sandbox → Production)

**Sandbox (Testing):**
- Use shortcode `174379`
- Passkey from Daraja portal
- Test phone: `254708374149` (Safaricom test number)
- Set `MPESA_ENV=sandbox`

**Production:**
- Apply for Go-Live on Daraja portal
- Change `MPESA_SHORTCODE` to your Paybill/Till
- Set `MPESA_ENV=production`

---

## 📁 Project Structure

```
solez-ke/
├── server.js               # Entry point
├── render.yaml             # Render deployment config
├── admin/
│   └── index.html          # Admin dashboard (full SPA)
├── src/
│   ├── bot/
│   │   ├── index.js        # Baileys connection
│   │   ├── handler.js      # Message router
│   │   └── menus/
│   │       ├── main.js     # Main menu
│   │       ├── shop.js     # Shopping flow
│   │       ├── cart.js     # Cart management
│   │       ├── checkout.js # Checkout + M-Pesa
│   │       ├── track.js    # Order tracking
│   │       └── support.js  # Customer support
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Waitlist.js
│   │   └── Settings.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── mpesa.js
│   │   ├── settings.js
│   │   └── stats.js
│   ├── middleware/
│   │   └── auth.js
│   └── utils/
│       ├── db.js
│       ├── daraja.js
│       ├── cloudinary.js
│       ├── counties.js
│       ├── helpers.js
│       └── cron.js
```

---

## 🤖 Bot Commands (Customer-Facing)

| Input | Action |
|---|---|
| `hi`, `hello`, `menu` | Show main menu |
| `1` | Browse shoes |
| `2` | Track order |
| `cart` | View cart |
| `TRACK ORD-0001` | Track specific order |
| `0` or `back` | Go back |
| `NEXT` / `PREV` | Paginate lists |
| `RETRY` | Resend M-Pesa prompt |

---

## 🧑‍💻 Built by CymorTech Services

> ✨ *Powered by CymorTech Services*
