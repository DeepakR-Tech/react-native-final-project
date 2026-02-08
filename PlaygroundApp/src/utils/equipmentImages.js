// Equipment Images - Local asset mapping for playground equipment
// These images are stored locally in assets/equipment folder

const equipmentImages = {
    'swing': require('../../assets/equipment/swing_set.png'),
    'swing_set': require('../../assets/equipment/swing_set.png'),
    'swings': require('../../assets/equipment/swing_set.png'),
    'classic swing set': require('../../assets/equipment/swing_set.png'),

    'slide': require('../../assets/equipment/rainbow_slide.png'),
    'slides': require('../../assets/equipment/rainbow_slide.png'),
    'rainbow slide tower': require('../../assets/equipment/rainbow_slide.png'),

    'climbing': require('../../assets/equipment/climbing_frame.png'),
    'climbing equipment': require('../../assets/equipment/climbing_frame.png'),
    'adventure climbing frame': require('../../assets/equipment/climbing_frame.png'),

    'spring rider': require('../../assets/equipment/spring_rider.png'),
    'spring riders': require('../../assets/equipment/spring_rider.png'),
    'spring rider - horse': require('../../assets/equipment/spring_rider.png'),

    'seesaw': require('../../assets/equipment/seesaw.png'),
    'seesaws': require('../../assets/equipment/seesaw.png'),
    'classic seesaw': require('../../assets/equipment/seesaw.png'),

    'merry-go-round': require('../../assets/equipment/merry_go_round.png'),
    'merry-go-rounds': require('../../assets/equipment/merry_go_round.png'),
    'merry-go-round deluxe': require('../../assets/equipment/merry_go_round.png'),

    'sand play': require('../../assets/equipment/sand_play_table.png'),
    'sand play table': require('../../assets/equipment/sand_play_table.png'),
    'interactive sand play table': require('../../assets/equipment/sand_play_table.png'),

    'fitness': require('../../assets/equipment/fitness_station.png'),
    'fitness equipment': require('../../assets/equipment/fitness_station.png'),
    'outdoor fitness station': require('../../assets/equipment/fitness_station.png'),
};

// Default fallback image - using swing set as default
const defaultImage = require('../../assets/equipment/swing_set.png');

/**
 * Get the appropriate equipment image based on the item name or category
 * @param {string} name - Equipment name
 * @param {string} category - Equipment category  
 * @returns {ImageSource} - Local image source
 */
export const getEquipmentImage = (name, category) => {
    const nameLower = name?.toLowerCase();
    const categoryLower = category?.toLowerCase();

    // First try to match by exact name
    if (nameLower && equipmentImages[nameLower]) {
        return equipmentImages[nameLower];
    }

    // Then try to match by category
    if (categoryLower && equipmentImages[categoryLower]) {
        return equipmentImages[categoryLower];
    }

    // Return default image if no match found
    return defaultImage;
};

export default equipmentImages;
