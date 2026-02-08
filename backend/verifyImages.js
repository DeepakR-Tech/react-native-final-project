const mongoose = require('mongoose');
const Equipment = require('./models/Equipment');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const verifyImages = async () => {
    await connectDB();
    console.log('\n🔍 Verifying equipment images...\n');

    const equipment = await Equipment.find({});

    let missingImages = 0;
    let totalItems = equipment.length;

    console.log(`Checking ${totalItems} items:`);
    console.log('----------------------------------------');

    equipment.forEach(item => {
        const hasImage = item.image && item.image.startsWith('http');
        const isGeneric = item.image && item.image.includes('source.unsplash.com'); // We want to avoid these now

        if (!hasImage || isGeneric) {
            console.log(`❌ ISSUE: "${item.name}" - Image: ${item.image}`);
            missingImages++;
        } else {
            // Optional: Print name to verify we have coverage
            // console.log(`✅ OK: "${item.name}"`);
        }
    });

    console.log('----------------------------------------');
    console.log(`Summary: ${totalItems - missingImages}/${totalItems} items have specific static images.`);

    process.exit(0);
};

verifyImages().catch(console.error);
