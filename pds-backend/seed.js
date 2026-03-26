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
  console.log('✅ Connected to MongoDB for Seeding...');

  try {
    // 1. Wipe all collections (including OTPs to remove stale records)
    const collections = ['users', 'shops', 'products', 'inventories', 'rationcards', 'slots', 'transactions', 'inventorylogs', 'otps'];
    for (const coll of collections) {
      try { await conn.connection.collection(coll).drop(); } catch (e) { /* ignore non-existent */ }
    }
    console.log('🗑️  All Old Collections Dropped (including OTPs)');

    // 2. Products
    await Product.create([
      { name: 'Rice',     price: 0,  unit: 'kg' },
      { name: 'Wheat',    price: 0,  unit: 'kg' },
      { name: 'Sugar',    price: 25, unit: 'kg' },
      { name: 'Urad Dal', price: 30, unit: 'kg' }
    ]);
    console.log('📦  Products Created');

    // 3. Dealer Users — NOW WITH TWO DEALERS ✅
    const dealer1 = await User.create({
      name: 'R. Rajesh Kumar',
      rationCardNumber: 'DEALER402',
      mobileNumber: '9876543210',
      email: 'dealer402@pds.local',
      password: 'password123',
      role: 'dealer',
      shopId: new mongoose.Types.ObjectId() // Placeholder
    });

    const dealer2 = await User.create({
      name: 'Akash David kumar M',
      rationCardNumber: 'DEALER505',
      mobileNumber: '9876543211',
      email: 'dealer505@pds.local',
      password: 'password123',
      role: 'dealer',
      shopId: new mongoose.Types.ObjectId() // Placeholder
    });

    // 4. Shops linked to dealers
    const shop1 = await Shop.create({
      name: 'Anna Nagar West FPS',
      location: 'Anna Nagar, Chennai',
      dealerId: dealer1._id,
      fpsCode: '402-AN'
    });

    const shop2 = await Shop.create({
      name: 'Adyar East FPS',
      location: 'Adyar, Chennai',
      dealerId: dealer2._id,
      fpsCode: '505-AD'
    });

    // 5. Update dealers with correct shopIds
    dealer1.shopId = shop1._id;
    await dealer1.save();
    dealer2.shopId = shop2._id;
    await dealer2.save();
    console.log('🏪  Two Shops & Dealers Linked');

    // 6. Inventory for both shops
    await Inventory.create([
      {
        shopId: shop1._id,
        riceStock: 5000,
        wheatStock: 2000,
        sugarStock: 500,
        dalStock: 300
      },
      {
        shopId: shop2._id,
        riceStock: 4500,
        wheatStock: 1800,
        sugarStock: 400,
        dalStock: 250
      }
    ]);
    console.log('💰  Shop Inventories Seeded');

    // 7. Beneficiaries — GENERATING 30+ BENEFICIARIES ✅
    const cardTypes = ['PHH', 'AAY', 'NPHH'];
    const names = ['Arun', 'Bala', 'Chitra', 'Deepa', 'Eshwar', 'Farooq', 'Ganesh', 'Hema', 'Indira', 'Jagan', 'Kavita', 'Lokesh', 'Meena', 'Nitin', 'Oviya', 'Prabhu', 'Qadir', 'Rani', 'Siva', 'Thara', 'Uday', 'Vani', 'Wilson', 'Xavier', 'Yuvraj', 'Zoya', 'Anand', 'Bhuvana', 'Chetan', 'Divya', 'Elango', 'Fathima'];
    
    const quotaRules = {
      PHH:  { r: 20, w: 5, s: 1, d: 1 },
      AAY:  { r: 35, w: 0, s: 1, d: 1 },
      NPHH: { r: 0,  w: 0, s: 1, d: 1 }
    };

    const users = [];
    const shops = [shop1, shop2];

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const cardNumber = `330101${(1000 + i).toString()}`;
      const mobile = `900001${(1000 + i).toString()}`;
      const email = `${name.toLowerCase()}${i}@test.com`;
      const aadhaar = `1122334455${(10 + i).toString()}`;
      const cardType = cardTypes[i % cardTypes.length];
      const shop = shops[i % shops.length];

      const familyMembers = [
        { name: name, age: 30 + (i % 20), relation: 'Head of Family' },
        { name: `Member_${i}_1`, age: 20 + (i % 10), relation: i % 2 === 0 ? 'Spouse' : 'Son' }
      ];

      const card = await RationCard.create({
        cardNumber,
        cardType,
        headOfFamily: name,
        headAadhaarNumber: aadhaar,
        shopId: shop._id,
        familyMembers
      });

      const r = quotaRules[cardType];

      const user = await User.create({
        name,
        rationCardNumber: cardNumber,
        mobileNumber: mobile,
        email,
        password: 'password123',
        role: 'beneficiary',
        rationCardId: card._id,
        shopId: shop._id,
        cardType,
        riceTotal: r.r,
        wheatTotal: r.w,
        sugarTotal: r.s,
        dalTotal: r.d,
        address: shop.location,
        familyMembers
      });
      users.push(user);
    }
    console.log(`✅  ${users.length} Beneficiaries Created and distributed between 2 shops`);

    // 8. Today's Appointment Slots (Cyclic time slots)
    const now = new Date();
    const timeSlots = ['09:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM'];
    const slotsList = users.map((u, i) => ({
      userId: u._id,
      shopId: u.shopId,
      date: now,
      timeSlot: timeSlots[i % timeSlots.length],
      status: 'booked'
    }));

    await Slot.create(slotsList);
    console.log('📅  Today\'s Appointment Slots Seeded');

    console.log('\n🌟 🌟 🌟  SEEDING COMPLETE  🌟 🌟 🌟');
    console.log('──────────────────────────────────────────');
    console.log('🔐 Dealer 1 Login : DEALER402 / password123');
    console.log('   Email          : dealer402@pds.local');
    console.log('🔐 Dealer 2 Login : DEALER505 / password123');
    console.log('   Email          : dealer505@pds.local');
    console.log('──────────────────────────────────────────');
    console.log(`👤 ${users[0].name} (${users[0].cardType}) : ${users[0].rationCardNumber} / password123`);
    console.log(`   Email          : ${users[0].email}`);
    console.log(`👤 ${users[1].name} (${users[1].cardType}) : ${users[1].rationCardNumber} / password123`);
    console.log(`   Email          : ${users[1].email}`);
    console.log(`👤 ${users[2].name} (${users[2].cardType}) : ${users[2].rationCardNumber} / password123`);
    console.log(`   Email          : ${users[2].email}`);
    console.log('... and 29 more beneficiaries.');
    console.log('──────────────────────────────────────────');

  } catch (error) {
    console.error('❌ ERROR SEEDING:', JSON.stringify(error, null, 2) || error.message);
  } finally {
    process.exit(0);
  }
}

seed();
