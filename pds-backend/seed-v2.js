import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import User from './models/User.js';
import Shop from './models/Shop.js';
import Inventory from './models/Inventory.js';
import RationCard from './models/RationCard.js';

dotenv.config();
connectDB();

const seedV2 = async () => {
  try {
    console.log('🗑️  Clearing Shop/Inventory/User data...');
    // We only clear these to avoid messing up existing products/rules if they exist
    await Shop.deleteMany();
    await Inventory.deleteMany();
    
    // Create Dealer
    console.log('🧑‍⚖️  Creating Dealer...');
    const dealer = await User.create({
      rationCardNumber: 'DEALER001',
      mobileNumber: '9876543210',
      password: 'password123',
      role: 'dealer',
    });

    // Part 11: Create 1 Shop (Anna Nagar FPS)
    console.log('🏪  Creating Shop (Anna Nagar FPS)...');
    const shop = await Shop.create({
      name: 'Anna Nagar FPS - Shop #42',
      location: '12th Main Road, Anna Nagar, Chennai',
      dealerId: dealer._id,
      fpsCode: 'FPS-AN-42'
    });

    // Part 11: Create Inventory
    console.log('📦  Creating Inventory...');
    await Inventory.create({
      shopId: shop._id,
      riceStock: 1000,
      wheatStock: 500,
      sugarStock: 200,
      dalStock: 200
    });

    // Update existing or create a sample user assigned to this shop
    console.log('👤  Assigning Users to Shop...');
    
    // Find the primary test beneficiary from seeder
    const beneficiary = await User.findOne({ rationCardNumber: 'PHH1234567890' });
    if (beneficiary) {
      beneficiary.shopId = shop._id;
      await beneficiary.save();
      
      // Update linked RationCard too
      if (beneficiary.rationCardId) {
        await RationCard.findByIdAndUpdate(beneficiary.rationCardId, { shopId: shop._id });
      }
      console.log('✅ Updated test user PHH1234567890');
    } else {
      console.log('⚠️  Test user PHH1234567890 not found. Run seeder.js first.');
    }

    console.log('🚀 Real-World System Ready!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error seeding system: ${error.message}`);
    process.exit(1);
  }
};

seedV2();
