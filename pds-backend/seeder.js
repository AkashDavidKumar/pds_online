import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import User from './models/User.js';
import RationCard from './models/RationCard.js';
import Product from './models/Product.js';
import EntitlementRule from './models/EntitlementRule.js';
import Shop from './models/Shop.js';
import Inventory from './models/Inventory.js';
import MonthlyQuota from './models/MonthlyQuota.js';
import Transaction from './models/Transaction.js';
import Complaint from './models/Complaint.js';

import { calculateEntitlementMap } from './controllers/quota.controller.js';

dotenv.config();
connectDB();

const importData = async () => {
    try {
        console.log('🗑️  Clearing Database for Real-World Upgrade...');
        await User.deleteMany();
        await RationCard.deleteMany();
        await Product.deleteMany();
        await EntitlementRule.deleteMany();
        await Shop.deleteMany();
        await Inventory.deleteMany();
        await MonthlyQuota.deleteMany();
        await Transaction.deleteMany();
        await Complaint.deleteMany();

        console.log('📦 Creating Products...');
        const products = await Product.insertMany([
            { name: 'Rice', unit: 'kg', price: 0 },
            { name: 'Sugar', unit: 'kg', price: 25 },
            { name: 'Wheat', unit: 'kg', price: 0 },
            { name: 'Oil', unit: 'ltr', price: 25 },
            { name: 'Kerosene', unit: 'ltr', price: 15 },
            { name: 'Dal', unit: 'kg', price: 30 },
        ]);

        const pMap = {};
        products.forEach(p => pMap[p.name] = p._id);

        console.log('📜 Creating Entitlement Rules...');
        await EntitlementRule.insertMany([
            { cardType: 'PHH', ricePerPerson: 5, sugar: 2, wheat: 5, oil: 1 },
            { cardType: 'AAY', fixedRice: 35, sugar: 2, wheat: 0, oil: 1 },
            { cardType: 'NPHH', fixedRice: 20, sugar: 1, wheat: 0, oil: 0 },
            { cardType: 'NPHH-S', fixedRice: 0, sugar: 2, wheat: 0, oil: 0 }
        ]);

        console.log('🧑‍⚖️  Creating Dealer User...');
        const dealerUser = await User.create({
            rationCardNumber: 'DEALER001',
            mobileNumber: '9876543210',
            password: 'password123',
            role: 'dealer',
        });

        console.log('🏪 Creating Shop...');
        const shop = await Shop.create({
            name: 'Anna Nagar FPS - Shop #42',
            location: '12th Main Road, Anna Nagar, Chennai',
            dealerId: dealerUser._id,
            fpsCode: 'FPS-AN-42'
        });

        // 🔥 LINK DEALER TO SHOP
        await User.findByIdAndUpdate(dealerUser._id, { shopId: shop._id });

        console.log('📦 Initializing Shop Inventory (V2 Flattened)...');
        await Inventory.create({
            shopId: shop._id,
            riceStock: 1000,
            wheatStock: 500,
            sugarStock: 200,
            dalStock: 200
        });

        console.log('💳 Creating Ration Cards & Linked Users...');

        const createBeneficiary = async (cardType, cardNo, members, mobile) => {
            const rc = await RationCard.create({
                cardNumber: cardNo,
                cardType: cardType,
                headOfFamily: members[0].name,
                headAadhaarNumber: members[0].aadhaarNumber,
                shopId: shop._id,
                familyMembers: members
            });

            const user = await User.create({
                rationCardNumber: cardNo,
                mobileNumber: mobile,
                password: 'password123',
                role: 'beneficiary',
                rationCardId: rc._id,
                shopId: shop._id, // LINKED DIRECTLY
                biometricEnabled: true,
                biometricRegisteredAt: new Date()
            });

            return rc;
        };

        const phhCard = await createBeneficiary('PHH', 'PHH1234567890', [
            { name: 'Senthil', age: 45, relation: 'Head', aadhaarNumber: '111122223333' },
            { name: 'Lakshmi', age: 40, relation: 'Spouse', aadhaarNumber: '444455556666' },
            { name: 'Karthik', age: 20, relation: 'Son', aadhaarNumber: '777788889999' },
            { name: 'Divya', age: 18, relation: 'Daughter', aadhaarNumber: '000011112222' }
        ], '9000011111');

        const aayCard = await createBeneficiary('AAY', 'AAY0987654321', [
            { name: 'Murugan', age: 60, relation: 'Head', aadhaarNumber: '333344445555' },
            { name: 'Valli', age: 55, relation: 'Spouse', aadhaarNumber: '666677778888' }
        ], '9000022222');

        console.log('📅 Creating Monthly Quotas...');
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const createQuota = async (rc) => {
            const eligibleMap = await calculateEntitlementMap(rc);
            const takenMap = {};
            const balanceMap = {};

            for (const [key, val] of Object.entries(eligibleMap)) {
                takenMap[key] = 0;
                balanceMap[key] = val;
            }

            await MonthlyQuota.create({
                rationCardId: rc._id,
                month,
                year,
                eligible: eligibleMap,
                taken: takenMap,
                balance: balanceMap
            });
        };

        await createQuota(phhCard);
        await createQuota(aayCard);

        console.log('✅ Real-World Data Seeded Successfully!');
        console.log('---------- CREDENTIALS ----------');
        console.log('Dealer: DEALER001 / password123');
        console.log('PHH User: PHH1234567890 / password123');
        console.log('AAY User: AAY0987654321 / password123');
        console.log('---------------------------------');

        process.exit();
    } catch (error) {
        console.error(`❌ Error seeding system: ${error.message}`);
        process.exit(1);
    }
};

importData();
