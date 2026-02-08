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

// Verified distinct images for Swings
const swingImages = {
    'Classic Swing Set': 'https://images.unsplash.com/photo-1595687453991-6c4de7d4e792?w=500&h=400&fit=crop', // Blue/Yellow Swing
    'Baby Bucket Swing': 'https://images.unsplash.com/photo-1612368955146-562db94d293d?w=500&h=400&fit=crop', // Toddler swing
    'Tire Swing Deluxe': 'https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=500&h=400&fit=crop', // Tire swing
    'Nest Swing XL': 'https://images.unsplash.com/photo-1587041224282-b458a2c23c03?w=500&h=400&fit=crop', // Nest/Rope swing
    'Accessible Swing Seat': 'https://images.unsplash.com/photo-1628173550478-439589dfec52?w=500&h=400&fit=crop', // Safe seat swing
    'Disc Swing': 'https://images.unsplash.com/photo-1564429238535-4c445842da9f?w=500&h=400&fit=crop', // Round swing
    'Double Glider Swing': 'https://images.unsplash.com/photo-1596997000103-e597b3ca50df?w=500&h=400&fit=crop', // Dual swing
    'Web Swing': 'https://images.unsplash.com/photo-1562771379-eafdca7a02f8?w=500&h=400&fit=crop', // Web/Spider swing
};

// Verified distinct images for Slides
const slideImages = {
    'Rainbow Slide Tower': 'https://images.unsplash.com/photo-1617096200347-cb04ae810b1d?w=500&h=400&fit=crop', // Colorful slide
    'Tunnel Slide': 'https://images.unsplash.com/photo-1582845512747-e42001c95638?w=500&h=400&fit=crop', // Tube slide
    'Wave Slide': 'https://images.unsplash.com/photo-1558383817-cd57691eb6a5?w=500&h=400&fit=crop', // Metal slide
    'Spiral Slide': 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=500&h=400&fit=crop', // Spiral slide
    'Double Racing Slide': 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=500&h=400&fit=crop', // Double slide
    'Toddler Mini Slide': 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500&h=400&fit=crop', // Small slide
    'Curved Slide': 'https://images.unsplash.com/photo-1560457079-9a6532ccb118?w=500&h=400&fit=crop', // Curved slide
    'Giant Drop Slide': 'https://images.unsplash.com/photo-1533038590840-1cde6e271758?w=500&h=400&fit=crop', // High/Tall slide
};

const otherImages = {
    'Adventure Climbing Frame': 'https://images.unsplash.com/photo-1496318447583-f524534e9ce1?w=500&h=400&fit=crop',
    'Rock Climbing Wall': 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=500&h=400&fit=crop',
    'Rope Pyramid': 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=500&h=400&fit=crop',
    'Spring Rider - Horse': 'https://images.unsplash.com/photo-1597735881932-d9664c9bbcea?w=500&h=400&fit=crop',
    'Spring Rider - Motorcycle': 'https://images.unsplash.com/photo-1558981033-0f0309284409?w=500&h=400&fit=crop',
    'Double Spring Rider': 'https://images.unsplash.com/photo-1612031286284-3caed3cecf05?w=500&h=400&fit=crop', // Dragon/Double
    'Classic Seesaw': 'https://images.unsplash.com/photo-1596997000122-ff71d4e1ddb9?w=500&h=400&fit=crop',
    'Four-Way Seesaw': 'https://images.unsplash.com/photo-1544813545-4827b64fcacb?w=500&h=400&fit=crop',
    'Merry-Go-Round Deluxe': 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=500&h=400&fit=crop',
    'Spinning Cup Ride': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=400&fit=crop',
    'Interactive Sand Play Table': 'https://images.unsplash.com/photo-1596568416180-1e0e0f7ebbee?w=500&h=400&fit=crop',
    'Giant Sand Box': 'https://images.unsplash.com/photo-1629984557682-41ddb6b3e2f5?w=500&h=400&fit=crop',
    'Outdoor Fitness Station': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=400&fit=crop',
    'Balance Beam Set': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&h=400&fit=crop',
    'Wooden Playhouse': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=400&fit=crop',
    'Castle Playhouse': 'https://images.unsplash.com/photo-1566454419290-57a64afe1e87?w=500&h=400&fit=crop', // Castle
};

const allImages = { ...swingImages, ...slideImages, ...otherImages };

const updateImages = async () => {
    await connectDB();
    console.log('\n🖼️ Updating equipment images with DISTINCT IDs...\n');

    for (const [name, imageUrl] of Object.entries(allImages)) {
        try {
            const result = await Equipment.updateOne(
                { name: name },
                { $set: { image: imageUrl } }
            );
            if (result.matchedCount > 0) {
                console.log(`✅ Updated: ${name}`);
            } else {
                console.log(`❌ Not found: ${name}`);
            }
        } catch (error) {
            console.error(`Error updating ${name}:`, error.message);
        }
    }

    console.log('\n✅ Image update complete!\n');
    process.exit(0);
};

updateImages().catch(console.error);
