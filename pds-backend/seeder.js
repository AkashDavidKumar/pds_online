import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

import User from './models/User.js';
import RationCard from './models/RationCard.js';
import Product from './models/Product.js';
import EntitlementRule from './models/EntitlementRule.js';
import Shop from './models/Shop.js';
import ShopInventory from './models/ShopInventory.js';
import Dealer from './models/Dealer.js';
import MonthlyQuota from './models/MonthlyQuota.js';
import Transaction from './models/Transaction.js';
import Complaint from './models/Complaint.js';

import { calculateEntitlementMap } from './controllers/quota.controller.js';

dotenv.config();
connectDB();

const importData = async () => {
    try {
        console.log('🗑️  Clearing Database...');
        await User.deleteMany();
        await RationCard.deleteMany();
        await Product.deleteMany();
        await EntitlementRule.deleteMany();
        await Shop.deleteMany();
        await ShopInventory.deleteMany();
        await Dealer.deleteMany();
        await MonthlyQuota.deleteMany();
        await Transaction.deleteMany();
        await Complaint.deleteMany();

        console.log('📦 Creating Products...');
        const products = await Product.insertMany([
            { name: 'Rice', unit: 'kg', price: 0 }, // Free usually
            { name: 'Sugar', unit: 'kg', price: 25 },
            { name: 'Wheat', unit: 'kg', price: 0 },
            { name: 'Oil', unit: 'ltr', price: 25 },
            { name: 'Kerosene', unit: 'ltr', price: 15 },
            { name: 'Dal', unit: 'kg', price: 30 },
        ]);

        // Map for easy access
        const pMap = {};
        products.forEach(p => pMap[p.name] = p._id);

        console.log('📜 Creating Entitlement Rules...');
        await EntitlementRule.insertMany([
            {
                cardType: 'PHH',
                ricePerPerson: 5,
                fixedRice: 0,
                sugar: 2,
                wheat: 5,
                oil: 1
            },
            {
                cardType: 'AAY',
                ricePerPerson: 0,
                fixedRice: 35,
                sugar: 2,
                wheat: 0,
                oil: 1
            },
            {
                cardType: 'NPHH',
                ricePerPerson: 0,
                fixedRice: 20,
                sugar: 1,
                wheat: 0,
                oil: 0
            },
            {
                cardType: 'NPHH-S', // Sugar only card
                ricePerPerson: 0,
                fixedRice: 0,
                sugar: 2,
                wheat: 0,
                oil: 0
            }
        ]);

        console.log('🏪 Creating Shop...');
        const shop = await Shop.create({
            fpsCode: 'FPS-001',
            name: 'PDS Shop 001 - Chennai',
            dealerName: 'Ramesh Kumar',
            location: {
                latitude: 13.0827,
                longitude: 80.2707,
                address: '123, Anna Salai, Chennai'
            }
        });

        console.log('📦 Creating Shop Inventory...');
        const inventoryItems = products.map(p => ({
            shopId: shop._id,
            productId: p._id,
            stock: 1000 // Initial stock 1000 for everything
        }));
        await ShopInventory.insertMany(inventoryItems);

        console.log('👨‍💼 Creating Dealer...');
        const dealer = await Dealer.create({
            name: 'Ramesh Kumar',
            mobileNumber: '9876543210',
            username: 'dealer001',
            password: 'password123',
            shopId: shop._id
        });

        // Create a Dealer User for login
        await User.create({
            rationCardNumber: 'DEALER001', // Dummy
            mobileNumber: dealer.mobileNumber,
            password: 'password123',
            role: 'dealer',
            address: shop.location.address
        });

        console.log('💳 Creating Ration Cards & Users...');

        const createBeneficiary = async (cardType, cardNo, members, mobile) => {
            const rc = await RationCard.create({
                cardNumber: cardNo,
                cardType: cardType,
                headOfFamily: members[0].name,
                headAadhaarNumber: members[0].aadhaarNumber,
                shopId: shop._id,
                familyMembers: members
            });

            await User.create({
                rationCardNumber: cardNo,
                mobileNumber: mobile,
                password: 'password123',
                role: 'beneficiary',
                rationCardId: rc._id,
                biometricEnabled: true,
                biometricRegisteredAt: new Date()
            });

            return rc;
        };

        // 1. PHH Family (4 members)
        const phhCard = await createBeneficiary('PHH', 'PHH1234567890', [
            { name: 'Senthil', age: 45, relation: 'Head', aadhaarNumber: '111122223333' },
            { name: 'Lakshmi', age: 40, relation: 'Spouse', aadhaarNumber: '444455556666' },
            { name: 'Karthik', age: 20, relation: 'Son', aadhaarNumber: '777788889999' },
            { name: 'Divya', age: 18, relation: 'Daughter', aadhaarNumber: '000011112222' }
        ], '9000011111');

        // 2. AAY Family (2 members)
        const aayCard = await createBeneficiary('AAY', 'AAY0987654321', [
            { name: 'Murugan', age: 60, relation: 'Head', aadhaarNumber: '333344445555' },
            { name: 'Valli', age: 55, relation: 'Spouse', aadhaarNumber: '666677778888' }
        ], '9000022222');

        console.log('📅 Creating Monthly Quotas...');
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const createQuota = async (rc) => {
            // Re-using logic via direct calculation
            // Note: In real app, we re-use controller logic, but here we just replicate or call helper
            // Since I exported calculateEntitlementMap from controller, I can use it!
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

        console.log('✅ Data Imported Successfully!');
        console.log('---------- CREDENTIALS ----------');
        console.log('Dealer: dealer001 / password123');
        console.log('PHH User: PHH1234567890 / password123');
        console.log('AAY User: AAY0987654321 / password123');
        console.log('---------------------------------');

        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
