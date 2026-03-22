import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Shop from './models/Shop.js';
import Product from './models/Product.js';
import Inventory from './models/Inventory.js';
import RationCard from './models/RationCard.js';
import Slot from './models/Slot.js';
import Transaction from './models/Transaction.js';
import InventoryLog from './models/InventoryLog.js';

dotenv.config();

async function seed() {
  const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pds_online');
  console.log('Connected to MongoDB for Seeding...');

  try {
    // 1. Wipe everything
    const collections = ['users', 'shops', 'products', 'inventories', 'rationcards', 'slots', 'transactions', 'inventorylogs'];
    for (const coll of collections) {
      try { await conn.connection.collection(coll).drop(); } catch (e) {}
    }
    console.log('🗑️  Existing Collections Dropped');

    // 2. Products
    await Product.create([
      { name: 'Rice', price: 0, unit: 'kg' },
      { name: 'Wheat', price: 0, unit: 'kg' },
      { name: 'Sugar', price: 25, unit: 'kg' },
      { name: 'Urad Dal', price: 30, unit: 'kg' }
    ]);
    console.log('📦  Products Created');

    // 3. Create Dealer User first to satisfy Shop's dealerId requirement
    const dealer = await User.create({
      name: 'R. Rajesh Kumar',
      rationCardNumber: 'DEALER402',
      mobileNumber: '9876543210',
      password: 'password123',
      role: 'dealer',
      shopId: new mongoose.Types.ObjectId() // Placeholder
    });

    // 4. Create Shop linked to dealer
    const shop = await Shop.create({
      name: 'Anna Nagar West FPS',
      location: 'Anna Nagar, Chennai',
      dealerId: dealer._id,
      fpsCode: '402-AN'
    });

    // 5. Update Dealer with correct shopId
    dealer.shopId = shop._id;
    await dealer.save();
    console.log('🏪  Shop & Dealer Linked');

    // 6. Inventory
    await Inventory.create({
      shopId: shop._id,
      riceStock: 5000,
      wheatStock: 2000,
      sugarStock: 500,
      dalStock: 300
    });
    console.log('💰  Shop Inventory Seeded');

    // 7. Beneficiaries
    const rationCardsData = [
      { cardNumber: '3301010001', cardType: 'PHH', headOfFamily: 'Suresh', headAadhaar: '112233445566' },
      { cardNumber: '3301010002', cardType: 'AAY', headOfFamily: 'Mani', headAadhaar: '223344556677' },
      { cardNumber: '3301010003', cardType: 'NPHH', headOfFamily: 'Anitha', headAadhaar: '334455667788' }
    ];

    const users = [];
    for (const data of rationCardsData) {
      const card = await RationCard.create({
        cardNumber: data.cardNumber,
        cardType: data.cardType,
        headOfFamily: data.headOfFamily,
        headAadhaarNumber: data.headAadhaar,
        shopId: shop._id,
        familyMembers: [{ name: data.headOfFamily, age: 40, relation: 'Head' }]
      });

      // Allocation Totals (Part of Single Source of Truth architecture)
      const qRules = { 
        'PHH': { r: 20, w: 5, s: 1, d: 1 }, 
        'AAY': { r: 35, w: 0, s: 1, d: 1 }, 
        'NPHH': { r: 0, w: 0, s: 1, d: 1 } 
      };
      const r = qRules[card.cardType];

      const user = await User.create({
        name: data.headOfFamily,
        rationCardNumber: data.cardNumber,
        mobileNumber: '90000' + data.cardNumber.slice(-5),
        password: 'password123',
        role: 'beneficiary',
        rationCardId: card._id,
        shopId: shop._id,
        cardType: card.cardType,
        riceTotal: r.r,
        wheatTotal: r.w,
        sugarTotal: r.s,
        dalTotal: r.d,
        address: 'Sector ' + data.cardNumber.slice(-1)
      });
      users.push(user);
    }
    console.log('✅  Beneficiaries & Allocation Limits Created');

    // 8. Daily Appointment Slots
    const now = new Date();
    const slotsList = users.map((u, i) => ({
      userId: u._id,
      shopId: shop._id,
      date: now,
      timeSlot: i === 0 ? '09:00 AM - 10:00 AM' : i === 1 ? '11:00 AM - 12:00 PM' : '02:00 PM - 03:00 PM',
      status: 'booked'
    }));

    await Slot.create(slotsList);
    console.log('📅  Today\'s Merchant Appointment Slots Seeded');

    console.log('\n🌟 🌟 🌟 SEEDING COMPLETE 🌟 🌟 🌟');
    console.log('-----------------------------------');
    console.log('Dealer Login: DEALER402 / password123');
    console.log('User 1 Login: 3301010001 / password123 (PHH)');
    console.log('User 2 Login: 3301010002 / password123 (AAY)');
    console.log('-----------------------------------');

  } catch (error) {
    console.error('❌  ERROR SEEDING:', JSON.stringify(error, null, 2) || error);
  } finally {
    process.exit(0);
  }
}

seed();
