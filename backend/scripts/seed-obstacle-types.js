import sequelize from '../config/database.js';
import ObstacleType from '../models/obstacleType.model.js';

const OBSTACLE_TYPES = [
  { name: 'Vertical', icon_key: 'vertical', category: 'jump', default_height_range: '0.60-1.60' },
  { name: 'Oxer', icon_key: 'oxer', category: 'jump', default_height_range: '0.80-1.50' },
  { name: 'Triple Bar', icon_key: 'triple_bar', category: 'jump', default_height_range: '0.80-1.40' },
  { name: 'Wall', icon_key: 'wall', category: 'jump', default_height_range: '0.60-1.40' },
  { name: 'Gate', icon_key: 'gate', category: 'jump', default_height_range: '0.60-1.20' },
  { name: 'Liverpool', icon_key: 'liverpool', category: 'jump', default_height_range: '0.80-1.40' },
  { name: 'Water Jump', icon_key: 'water', category: 'terrain', default_height_range: null },
  { name: 'Bank', icon_key: 'bank', category: 'terrain', default_height_range: '0.40-1.00' },
  { name: 'Ditch', icon_key: 'ditch', category: 'terrain', default_height_range: null },
  { name: 'Bounce', icon_key: 'bounce', category: 'combination', default_height_range: '0.60-1.20' },
  { name: 'Double Combination', icon_key: 'double_combo', category: 'combination', default_height_range: '0.80-1.40' },
  { name: 'Triple Combination', icon_key: 'triple_combo', category: 'combination', default_height_range: '0.80-1.30' },
];

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    for (const type of OBSTACLE_TYPES) {
      await ObstacleType.findOrCreate({
        where: { name: type.name },
        defaults: type,
      });
    }

    console.log('Obstacle types seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
