/**
 * Seed reference data: disciplines, stables, and horses.
 * Run from backend directory: node scripts/seed-reference-data.js
 * Uses same DB config as the app (NODE_ENV=production → .env.production / Railway vars).
 *
 * Course focus types (Rider focused, Horse focused, Balanced) are already in the
 * Course model as focus_type ENUM('rider_focused', 'horse_focused', 'balanced') — no seed needed.
 */

import sequelize from '../config/database.js';
import '../models/index.js';
import { Discipline, Stable, Horse } from '../models/index.js';

const DISCIPLINES = [
  { name: 'Dressage' },
  { name: 'Jumping' },
  { name: 'Gymnastics' },
  { name: 'Flatwork' },
];

const STABLES = [
  { name: 'Elite Equestrian', city: 'Riyadh', country: 'Saudi Arabia' },
  { name: 'Sawari Stables', city: 'Riyadh', country: 'Saudi Arabia' },
  { name: 'Alma Stables', city: 'Riyadh', country: 'Saudi Arabia' },
  { name: 'Ghazzawi Stables', city: 'Riyadh', country: 'Saudi Arabia' },
  { name: 'Moka Academy', city: 'Riyadh', country: 'Saudi Arabia' },
  { name: 'Trio Ranch', city: 'Riyadh', country: 'Saudi Arabia' },
];

const HORSES_BY_STABLE_NAME = {
  'Elite Equestrian': ['Ferrari', 'Bahr', 'Beauty'],
  'Moka Academy': ['Liva', 'Sierra', 'Zamzam'],
};

const DEFAULT_LOCATION = 'Address to be updated';

async function seedDisciplines() {
  console.log('Seeding disciplines...');
  for (const d of DISCIPLINES) {
    const [row, created] = await Discipline.findOrCreate({
      where: { name: d.name },
      defaults: { name: d.name, is_active: true },
    });
    if (created) console.log('  Created discipline:', d.name);
  }
}

async function seedStables() {
  console.log('Seeding stables...');
  const stableIds = {};
  for (const s of STABLES) {
    const [row, created] = await Stable.findOrCreate({
      where: { name: s.name },
      defaults: {
        name: s.name,
        location_address: DEFAULT_LOCATION,
        city: s.city,
        country: s.country,
        is_approved: true,
        is_active: true,
        is_featured: false,
      },
    });
    stableIds[s.name] = row.id;
    if (created) console.log('  Created stable:', s.name);
  }
  return stableIds;
}

async function seedHorses(stableIds) {
  const dressage = await Discipline.findOne({ where: { name: 'Dressage' } });
  if (!dressage) throw new Error('Discipline Dressage not found. Run discipline seed first.');
  const disciplineId = dressage.id;

  console.log('Seeding horses...');
  for (const [stableName, horseNames] of Object.entries(HORSES_BY_STABLE_NAME)) {
    const stableId = stableIds[stableName];
    if (!stableId) continue;
    for (const name of horseNames) {
      const [, created] = await Horse.findOrCreate({
        where: { name, stable_id: stableId },
        defaults: {
          name,
          stable_id: stableId,
          discipline_id: disciplineId,
          status: 'available',
          is_featured: false,
          max_daily_sessions: 3,
        },
      });
      if (created) console.log('  Created horse:', name, '@', stableName);
    }
  }
}

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  try {
    await seedDisciplines();
    const stableIds = await seedStables();
    await seedHorses(stableIds);
    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
