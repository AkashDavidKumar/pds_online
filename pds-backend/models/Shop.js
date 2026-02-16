import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
    {
        fpsCode: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        dealerName: { type: String, required: true },
        location: {
            latitude: Number,
            longitude: Number,
            address: String,
        },
    },
    { timestamps: true }
);

const Shop = mongoose.model('Shop', shopSchema);
export default Shop;
