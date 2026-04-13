/**
 * Seed reference data: disciplines, stables, horses, and demo data for Moka Academy.
 * Run from backend directory: node scripts/seed-reference-data.js
 * Uses same DB config as the app (NODE_ENV=production → .env.production / Railway vars).
 */

import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import '../models/index.js';
import {
  Admin, Arena, CoachStable, Discipline, Horse, HorseMaintenance,
  LessonBooking, Stable, User,
} from '../models/index.js';

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
    const [, created] = await Discipline.findOrCreate({
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
        state: s.city,
        pincode: '00000',
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
  const jumping = await Discipline.findOne({ where: { name: 'Jumping' } });
  const disciplineId = dressage.id;

  console.log('Seeding horses...');
  const horseIds = {};
  for (const [stableName, horseNames] of Object.entries(HORSES_BY_STABLE_NAME)) {
    const stableId = stableIds[stableName];
    if (!stableId) continue;
    for (const name of horseNames) {
      const [row, created] = await Horse.findOrCreate({
        where: { name, stable_id: stableId },
        defaults: {
          name,
          stable_id: stableId,
          discipline_id: name === 'Sierra' && jumping ? jumping.id : disciplineId,
          status: 'available',
          is_featured: false,
          max_daily_sessions: 3,
          breed: name === 'Liva' ? 'Arabian' : name === 'Sierra' ? 'Thoroughbred' : 'Warmblood',
          age: name === 'Liva' ? 8 : name === 'Sierra' ? 6 : 10,
          training_level: name === 'Zamzam' ? 'advanced' : 'intermediate',
          temperament: name === 'Liva' ? 'Calm' : name === 'Sierra' ? 'Energetic' : 'Steady',
        },
      });
      horseIds[name] = row.id;
      if (created) console.log('  Created horse:', name, '@', stableName);
    }
  }
  return horseIds;
}

// ── Moka Academy demo data ──

async function seedMokaCoach(stableIds) {
  const mokaId = stableIds['Moka Academy'];
  if (!mokaId) return null;

  console.log('Seeding Moka coach...');
  const [coach, created] = await User.findOrCreate({
    where: { email: 'khalid.coach@equora.demo' },
    defaults: {
      first_name: 'Khalid',
      last_name: 'Al-Harbi',
      email: 'khalid.coach@equora.demo',
      mobile_number: '+966500000001',
      role: 'coach',
      is_active: true,
      firebase_uid: 'demo_coach_khalid',
    },
  });
  if (created) console.log('  Created coach: Khalid Al-Harbi');

  // Link coach to Moka stable
  await CoachStable.findOrCreate({
    where: { coach_id: coach.id, stable_id: mokaId },
    defaults: { coach_id: coach.id, stable_id: mokaId, is_active: true },
  });

  return coach;
}

async function seedMokaRider(stableIds) {
  const mokaId = stableIds['Moka Academy'];
  if (!mokaId) return null;

  console.log('Seeding Moka rider...');
  const [rider, created] = await User.findOrCreate({
    where: { email: 'noura.rider@equora.demo' },
    defaults: {
      first_name: 'Noura',
      last_name: 'Al-Rashid',
      email: 'noura.rider@equora.demo',
      mobile_number: '+966500000002',
      role: 'rider',
      is_active: true,
      firebase_uid: 'demo_rider_noura',
    },
  });
  if (created) console.log('  Created rider: Noura Al-Rashid');
  return rider;
}

async function seedMokaArena(stableIds) {
  const mokaId = stableIds['Moka Academy'];
  if (!mokaId) return null;

  const dressage = await Discipline.findOne({ where: { name: 'Dressage' } });
  if (!dressage) {
    console.warn('  Skipping arena — Dressage discipline not found.');
    return null;
  }
  const [arena, created] = await Arena.findOrCreate({
    where: { name: 'Main Arena', stable_id: mokaId },
    defaults: {
      name: 'Main Arena',
      stable_id: mokaId,
      discipline_id: dressage.id,
      surface_type: 'sand',
      is_active: true,
    },
  });
  if (created) console.log('  Created arena: Main Arena @ Moka');
  return arena;
}

async function seedMokaBookings({ stableId, coach, rider, arena, horseIds }) {
  if (!stableId || !coach || !rider) return;
  console.log('Seeding Moka bookings...');

  const today = new Date();
  const bookings = [
    {
      status: 'completed', daysOffset: -7,
      start: '17:00:00', end: '17:45:00', duration: 45, horseName: 'Liva',
    },
    {
      status: 'completed', daysOffset: -3,
      start: '18:00:00', end: '19:00:00', duration: 60, horseName: 'Sierra',
    },
    {
      status: 'confirmed', daysOffset: 1,
      start: '17:30:00', end: '18:15:00', duration: 45, horseName: 'Zamzam',
    },
    {
      status: 'confirmed', daysOffset: 3,
      start: '19:00:00', end: '19:45:00', duration: 45, horseName: 'Liva',
    },
    {
      status: 'pending_review', daysOffset: 5,
      start: '18:00:00', end: '18:30:00', duration: 30, horseName: 'Sierra',
    },
  ];

  for (const b of bookings) {
    const date = new Date(today);
    date.setDate(date.getDate() + b.daysOffset);
    const dateStr = date.toISOString().slice(0, 10);

    await LessonBooking.findOrCreate({
      where: {
        coach_id: coach.id,
        rider_id: rider.id,
        booking_date: dateStr,
        start_time: b.start,
      },
      defaults: {
        rider_id: rider.id,
        coach_id: coach.id,
        stable_id: stableId,
        arena_id: arena?.id || null,
        horse_id: horseIds[b.horseName] || null,
        booking_date: dateStr,
        start_time: b.start,
        end_time: b.end,
        duration_minutes: b.duration,
        lesson_type: 'private',
        booking_type: 'lesson',
        status: b.status,
        price: b.duration === 60 ? 300 : 225,
      },
    });
    console.log(`  Booking: ${b.status} on ${dateStr} (${b.horseName})`);
  }
}

async function seedMokaMaintenance({ stableId, horseIds, adminId }) {
  if (!stableId) return;
  console.log('Seeding Moka horse maintenance...');

  const today = new Date();
  const dateStr = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
  const daysFromNow = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

  const logs = [
    // Liva — vaccinations
    { horse: 'Liva', type: 'vaccination', title: 'Tetanus booster',
      date: daysAgo(60), next: daysFromNow(305), provider: 'Dr. Ahmed Yassin', cost: 250 },
    { horse: 'Liva', type: 'vaccination', title: 'Equine influenza',
      date: daysAgo(90), next: daysFromNow(90), provider: 'Dr. Ahmed Yassin', cost: 300 },
    // Liva — farrier (overdue for demo)
    { horse: 'Liva', type: 'farrier', title: 'Full shoeing — all four',
      date: daysAgo(70), next: daysAgo(14), provider: 'Mohammed Al-Farsi', cost: 400,
      desc: 'Front shoes replaced, rear trimmed' },
    // Liva — dental
    { horse: 'Liva', type: 'dental', title: 'Annual dental float',
      date: daysAgo(200), next: daysFromNow(165), provider: 'Dr. Samir Equine Clinic', cost: 500 },

    // Sierra — vaccinations
    { horse: 'Sierra', type: 'vaccination', title: 'Tetanus + flu combo',
      date: daysAgo(30), next: daysFromNow(335), provider: 'Dr. Ahmed Yassin', cost: 350 },
    // Sierra — farrier (upcoming)
    { horse: 'Sierra', type: 'farrier', title: 'Trim and reset — fronts',
      date: daysAgo(42), next: daysFromNow(7), provider: 'Mohammed Al-Farsi', cost: 350 },
    // Sierra — deworming
    { horse: 'Sierra', type: 'deworming', title: 'Spring deworming — ivermectin',
      date: daysAgo(15), next: daysFromNow(165), provider: 'Stable staff', cost: 80 },
    // Sierra — vet visit
    { horse: 'Sierra', type: 'vet_visit', title: 'Lameness check — right front',
      date: daysAgo(5), provider: 'Dr. Ahmed Yassin', cost: 600,
      desc: 'Mild strain, 3-day rest recommended. Cleared for light work.' },

    // Zamzam — vaccinations (overdue for demo)
    { horse: 'Zamzam', type: 'vaccination', title: 'Strangles vaccine',
      date: daysAgo(380), next: daysAgo(15), provider: 'Dr. Samir Equine Clinic', cost: 280 },
    // Zamzam — farrier
    { horse: 'Zamzam', type: 'farrier', title: 'Full trim — barefoot',
      date: daysAgo(35), next: daysFromNow(21), provider: 'Mohammed Al-Farsi', cost: 200 },
    // Zamzam — deworming
    { horse: 'Zamzam', type: 'deworming', title: 'Fall deworming — moxidectin',
      date: daysAgo(180), next: daysFromNow(0), provider: 'Stable staff', cost: 90 },
    // Zamzam — general
    { horse: 'Zamzam', type: 'general', title: 'Microchip implant verified',
      date: daysAgo(120), provider: 'Dr. Ahmed Yassin', cost: 150 },
  ];

  for (const l of logs) {
    const horseId = horseIds[l.horse];
    if (!horseId) continue;
    await HorseMaintenance.findOrCreate({
      where: { horse_id: horseId, title: l.title, date_performed: dateStr(l.date) },
      defaults: {
        horse_id: horseId,
        stable_id: stableId,
        type: l.type,
        title: l.title,
        description: l.desc || null,
        provider_name: l.provider || null,
        cost: l.cost || null,
        date_performed: dateStr(l.date),
        next_due_date: l.next ? dateStr(l.next) : null,
        created_by: adminId || null,
      },
    });
    console.log(`  ${l.horse}: ${l.type} — ${l.title}`);
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
    const horseIds = await seedHorses(stableIds);

    // Moka Academy demo data
    const mokaId = stableIds['Moka Academy'];
    const coach = await seedMokaCoach(stableIds);
    const rider = await seedMokaRider(stableIds);
    const arena = await seedMokaArena(stableIds);

    if (mokaId && coach && rider) {
      await seedMokaBookings({ stableId: mokaId, coach, rider, arena, horseIds });
    }

    // Find an admin for maintenance created_by
    const admin = await Admin.findOne({ where: { role: 'super_admin' } });
    await seedMokaMaintenance({ stableId: mokaId, horseIds, adminId: admin?.id || null });

    console.log('Seed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
