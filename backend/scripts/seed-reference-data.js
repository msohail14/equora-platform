/**
 * Seed reference data: disciplines, stables, horses, and demo data.
 * Run from backend directory: node scripts/seed-reference-data.js
 * Uses same DB config as the app (NODE_ENV=production → .env.production / Railway vars).
 */

import bcrypt from 'bcryptjs';
import sequelize from '../config/database.js';
import '../models/index.js';
import {
  Admin, Arena, CoachStable, Discipline, Horse, HorseMaintenance,
  LessonBooking, Stable, StableModule, User,
} from '../models/index.js';

// ── Helpers ──

const today = new Date();
const dateStr = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };
const daysFromNow = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };

// ── Reference data ──

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

const HORSES_CONFIG = {
  'Elite Equestrian': [
    { name: 'Ferrari', breed: 'Arabian', age: 7, training_level: 'advanced', temperament: 'Spirited', discipline: 'Jumping' },
    { name: 'Bahr', breed: 'Thoroughbred', age: 9, training_level: 'advanced', temperament: 'Bold', discipline: 'Jumping' },
    { name: 'Beauty', breed: 'Warmblood', age: 5, training_level: 'intermediate', temperament: 'Gentle', discipline: 'Dressage' },
    { name: 'Storm', breed: 'Arabian', age: 12, training_level: 'advanced', temperament: 'Steady', discipline: 'Dressage' },
    { name: 'Majesty', breed: 'Hanoverian', age: 6, training_level: 'intermediate', temperament: 'Calm', discipline: 'Jumping' },
  ],
  'Moka Academy': [
    { name: 'Liva', breed: 'Arabian', age: 8, training_level: 'intermediate', temperament: 'Calm', discipline: 'Dressage' },
    { name: 'Sierra', breed: 'Thoroughbred', age: 6, training_level: 'intermediate', temperament: 'Energetic', discipline: 'Jumping' },
    { name: 'Zamzam', breed: 'Warmblood', age: 10, training_level: 'advanced', temperament: 'Steady', discipline: 'Dressage' },
  ],
};

const DEFAULT_LOCATION = 'Address to be updated';

// ── Core seed functions ──

async function seedDisciplines() {
  console.log('Seeding disciplines...');
  const ids = {};
  for (const d of DISCIPLINES) {
    const [row, created] = await Discipline.findOrCreate({
      where: { name: d.name },
      defaults: { name: d.name, is_active: true },
    });
    ids[d.name] = row.id;
    if (created) console.log('  Created discipline:', d.name);
  }
  return ids;
}

async function seedStables() {
  console.log('Seeding stables...');
  const stableIds = {};
  for (const s of STABLES) {
    const [row, created] = await Stable.findOrCreate({
      where: { name: s.name },
      defaults: {
        name: s.name, location_address: DEFAULT_LOCATION,
        city: s.city, country: s.country, state: s.city, pincode: '00000',
        is_approved: true, is_active: true, is_featured: false,
      },
    });
    stableIds[s.name] = row.id;
    if (created) console.log('  Created stable:', s.name);
  }
  return stableIds;
}

async function seedHorses(stableIds, disciplineIds) {
  console.log('Seeding horses...');
  const horseIds = {};
  for (const [stableName, horses] of Object.entries(HORSES_CONFIG)) {
    const stableId = stableIds[stableName];
    if (!stableId) continue;
    for (const h of horses) {
      const [row, created] = await Horse.findOrCreate({
        where: { name: h.name, stable_id: stableId },
        defaults: {
          name: h.name, stable_id: stableId,
          discipline_id: disciplineIds[h.discipline] || disciplineIds['Dressage'],
          status: 'available', is_featured: false, max_daily_sessions: 3,
          breed: h.breed, age: h.age, training_level: h.training_level,
          temperament: h.temperament,
        },
      });
      horseIds[h.name] = row.id;
      if (created) console.log('  Created horse:', h.name, '@', stableName);
    }
  }
  return horseIds;
}

// ── Shared seeding helpers ──

async function seedCoach({ email, firstName, lastName, mobile, uid, stableId }) {
  const [coach, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      first_name: firstName, last_name: lastName, email,
      mobile_number: mobile, role: 'coach', is_active: true, firebase_uid: uid,
    },
  });
  if (created) console.log(`  Created coach: ${firstName} ${lastName}`);
  await CoachStable.findOrCreate({
    where: { coach_id: coach.id, stable_id: stableId },
    defaults: { coach_id: coach.id, stable_id: stableId, is_active: true },
  });
  return coach;
}

async function seedRider({ email, firstName, lastName, mobile, uid }) {
  const [rider, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      first_name: firstName, last_name: lastName, email,
      mobile_number: mobile, role: 'rider', is_active: true, firebase_uid: uid,
    },
  });
  if (created) console.log(`  Created rider: ${firstName} ${lastName}`);
  return rider;
}

async function seedArena({ name, stableId, disciplineId, surface }) {
  const [arena, created] = await Arena.findOrCreate({
    where: { name, stable_id: stableId },
    defaults: {
      name, stable_id: stableId, discipline_id: disciplineId,
      surface_type: surface || 'sand', is_active: true,
    },
  });
  if (created) console.log(`  Created arena: ${name}`);
  return arena;
}

async function seedBookings(bookingDefs) {
  for (const b of bookingDefs) {
    const date = new Date(today);
    date.setDate(date.getDate() + b.daysOffset);
    const bookingDate = dateStr(date);
    await LessonBooking.findOrCreate({
      where: { coach_id: b.coachId, rider_id: b.riderId, booking_date: bookingDate, start_time: b.start },
      defaults: {
        rider_id: b.riderId, coach_id: b.coachId, stable_id: b.stableId,
        arena_id: b.arenaId || null, horse_id: b.horseId || null,
        booking_date: bookingDate, start_time: b.start, end_time: b.end,
        duration_minutes: b.duration, lesson_type: b.lessonType || 'private',
        booking_type: 'lesson', status: b.status, price: b.price || 225,
      },
    });
    console.log(`  Booking: ${b.status} on ${bookingDate}`);
  }
}

async function seedMaintenance(logs, stableId, horseIds, adminId) {
  for (const l of logs) {
    const horseId = horseIds[l.horse];
    if (!horseId) continue;
    await HorseMaintenance.findOrCreate({
      where: { horse_id: horseId, title: l.title, date_performed: dateStr(l.date) },
      defaults: {
        horse_id: horseId, stable_id: stableId, type: l.type, title: l.title,
        description: l.desc || null, provider_name: l.provider || null,
        cost: l.cost || null, date_performed: dateStr(l.date),
        next_due_date: l.next ? dateStr(l.next) : null, created_by: adminId || null,
      },
    });
    console.log(`  ${l.horse}: ${l.type} — ${l.title}`);
  }
}

// ── Elite Equestrian demo data ──

async function seedEliteData(stableIds, disciplineIds, horseIds, adminId) {
  const eliteId = stableIds['Elite Equestrian'];
  if (!eliteId) return;
  console.log('\n── Seeding Elite Equestrian demo data ──');

  // Coaches
  const coachTariq = await seedCoach({
    email: 'tariq.coach@equora.demo', firstName: 'Tariq', lastName: 'Al-Dosari',
    mobile: '+966500000010', uid: 'demo_coach_tariq', stableId: eliteId,
  });
  const coachSara = await seedCoach({
    email: 'sara.coach@equora.demo', firstName: 'Sara', lastName: 'Al-Otaibi',
    mobile: '+966500000011', uid: 'demo_coach_sara', stableId: eliteId,
  });

  // Riders
  const riderFaisal = await seedRider({
    email: 'faisal.rider@equora.demo', firstName: 'Faisal', lastName: 'Al-Ghamdi',
    mobile: '+966500000020', uid: 'demo_rider_faisal',
  });
  const riderLama = await seedRider({
    email: 'lama.rider@equora.demo', firstName: 'Lama', lastName: 'Al-Saud',
    mobile: '+966500000021', uid: 'demo_rider_lama',
  });
  const riderAbdullah = await seedRider({
    email: 'abdullah.rider@equora.demo', firstName: 'Abdullah', lastName: 'Al-Qahtani',
    mobile: '+966500000022', uid: 'demo_rider_abdullah',
  });
  const riderReema = await seedRider({
    email: 'reema.rider@equora.demo', firstName: 'Reema', lastName: 'Al-Turki',
    mobile: '+966500000023', uid: 'demo_rider_reema',
  });

  // Arenas
  const dressageId = disciplineIds['Dressage'];
  const jumpingId = disciplineIds['Jumping'];
  const arenaMain = await seedArena({ name: 'Grand Arena', stableId: eliteId, disciplineId: jumpingId, surface: 'sand' });
  const arenaDressage = await seedArena({ name: 'Dressage Court', stableId: eliteId, disciplineId: dressageId, surface: 'synthetic' });

  // Bookings — spread across coaches, riders, horses, statuses
  console.log('Seeding Elite bookings...');
  await seedBookings([
    // Past completed sessions (Tariq)
    { coachId: coachTariq.id, riderId: riderFaisal.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Ferrari'], daysOffset: -14, start: '17:00:00', end: '18:00:00', duration: 60, status: 'completed', price: 350 },
    { coachId: coachTariq.id, riderId: riderLama.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Bahr'], daysOffset: -12, start: '18:00:00', end: '18:45:00', duration: 45, status: 'completed', price: 275 },
    { coachId: coachTariq.id, riderId: riderAbdullah.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Majesty'], daysOffset: -10, start: '17:30:00', end: '18:30:00', duration: 60, status: 'completed', price: 350 },
    { coachId: coachTariq.id, riderId: riderFaisal.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Ferrari'], daysOffset: -7, start: '17:00:00', end: '17:45:00', duration: 45, status: 'completed', price: 275 },
    { coachId: coachTariq.id, riderId: riderReema.id, stableId: eliteId, arenaId: arenaDressage.id,
      horseId: horseIds['Storm'], daysOffset: -5, start: '19:00:00', end: '20:00:00', duration: 60, status: 'completed', price: 350 },
    // Past completed sessions (Sara)
    { coachId: coachSara.id, riderId: riderLama.id, stableId: eliteId, arenaId: arenaDressage.id,
      horseId: horseIds['Beauty'], daysOffset: -11, start: '17:00:00', end: '17:45:00', duration: 45, status: 'completed', price: 275 },
    { coachId: coachSara.id, riderId: riderReema.id, stableId: eliteId, arenaId: arenaDressage.id,
      horseId: horseIds['Storm'], daysOffset: -8, start: '18:00:00', end: '19:00:00', duration: 60, status: 'completed', price: 350 },
    { coachId: coachSara.id, riderId: riderAbdullah.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Bahr'], daysOffset: -4, start: '17:00:00', end: '18:00:00', duration: 60, status: 'completed', price: 350 },
    // Upcoming confirmed
    { coachId: coachTariq.id, riderId: riderFaisal.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Ferrari'], daysOffset: 1, start: '17:00:00', end: '18:00:00', duration: 60, status: 'confirmed', price: 350 },
    { coachId: coachTariq.id, riderId: riderLama.id, stableId: eliteId, arenaId: arenaDressage.id,
      horseId: horseIds['Beauty'], daysOffset: 1, start: '18:30:00', end: '19:15:00', duration: 45, status: 'confirmed', price: 275 },
    { coachId: coachSara.id, riderId: riderReema.id, stableId: eliteId, arenaId: arenaDressage.id,
      horseId: horseIds['Storm'], daysOffset: 2, start: '17:00:00', end: '18:00:00', duration: 60, status: 'confirmed', price: 350 },
    { coachId: coachTariq.id, riderId: riderAbdullah.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Majesty'], daysOffset: 3, start: '19:00:00', end: '19:45:00', duration: 45, status: 'confirmed', price: 275 },
    { coachId: coachSara.id, riderId: riderFaisal.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Bahr'], daysOffset: 4, start: '17:30:00', end: '18:30:00', duration: 60, status: 'confirmed', price: 350 },
    // Pending review
    { coachId: coachTariq.id, riderId: riderLama.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Ferrari'], daysOffset: 5, start: '18:00:00', end: '18:45:00', duration: 45, status: 'pending_review', price: 275 },
    { coachId: coachSara.id, riderId: riderAbdullah.id, stableId: eliteId, arenaId: arenaDressage.id,
      horseId: horseIds['Beauty'], daysOffset: 6, start: '17:00:00', end: '18:00:00', duration: 60, status: 'pending_review', price: 350 },
    { coachId: coachTariq.id, riderId: riderReema.id, stableId: eliteId, arenaId: arenaMain.id,
      horseId: horseIds['Majesty'], daysOffset: 7, start: '19:00:00', end: '20:30:00', duration: 90, status: 'pending_review', price: 450 },
  ]);

  // Horse maintenance — comprehensive records for all 5 horses
  console.log('Seeding Elite horse maintenance...');
  await seedMaintenance([
    // Ferrari
    { horse: 'Ferrari', type: 'vaccination', title: 'Tetanus + EWT combo', date: daysAgo(45), next: daysFromNow(320), provider: 'Dr. Nasser Al-Fahad', cost: 400 },
    { horse: 'Ferrari', type: 'vaccination', title: 'Equine influenza', date: daysAgo(75), next: daysFromNow(105), provider: 'Dr. Nasser Al-Fahad', cost: 300 },
    { horse: 'Ferrari', type: 'farrier', title: 'Full reset — competition shoes', date: daysAgo(21), next: daysFromNow(28), provider: 'Ali Al-Shammari', cost: 550, desc: 'Aluminum competition plates, all four' },
    { horse: 'Ferrari', type: 'dental', title: 'Annual dental float + wolf teeth', date: daysAgo(150), next: daysFromNow(215), provider: 'Dr. Nasser Al-Fahad', cost: 700 },
    { horse: 'Ferrari', type: 'deworming', title: 'Spring deworming — ivermectin', date: daysAgo(20), next: daysFromNow(160), provider: 'Stable staff', cost: 85 },
    { horse: 'Ferrari', type: 'vet_visit', title: 'Pre-competition wellness check', date: daysAgo(10), provider: 'Dr. Nasser Al-Fahad', cost: 800, desc: 'Full blood panel, flexion test, ECG. All clear for competition.' },

    // Bahr
    { horse: 'Bahr', type: 'vaccination', title: 'Tetanus booster', date: daysAgo(100), next: daysFromNow(265), provider: 'Dr. Nasser Al-Fahad', cost: 250 },
    { horse: 'Bahr', type: 'vaccination', title: 'Rabies annual', date: daysAgo(60), next: daysFromNow(305), provider: 'Dr. Nasser Al-Fahad', cost: 200 },
    { horse: 'Bahr', type: 'farrier', title: 'Trim and reset — fronts only', date: daysAgo(50), next: daysAgo(2), provider: 'Ali Al-Shammari', cost: 350, desc: 'Overdue — scheduled for this week' },
    { horse: 'Bahr', type: 'dental', title: 'Semi-annual dental check', date: daysAgo(90), next: daysFromNow(90), provider: 'Royal Equine Dental', cost: 450 },
    { horse: 'Bahr', type: 'vet_visit', title: 'Hock injection — maintenance', date: daysAgo(30), next: daysFromNow(150), provider: 'Dr. Nasser Al-Fahad', cost: 1200, desc: 'HA + corticosteroid bilateral hocks. Good response expected.' },
    { horse: 'Bahr', type: 'general', title: 'Coggins / EIA test — annual', date: daysAgo(55), next: daysFromNow(310), provider: 'Dr. Nasser Al-Fahad', cost: 180 },

    // Beauty
    { horse: 'Beauty', type: 'vaccination', title: 'Tetanus + flu combo', date: daysAgo(30), next: daysFromNow(335), provider: 'Dr. Nasser Al-Fahad', cost: 350 },
    { horse: 'Beauty', type: 'farrier', title: 'Full trim — barefoot', date: daysAgo(28), next: daysFromNow(21), provider: 'Ali Al-Shammari', cost: 200 },
    { horse: 'Beauty', type: 'deworming', title: 'Fecal egg count + pyrantel', date: daysAgo(40), next: daysFromNow(140), provider: 'Stable staff', cost: 120, desc: 'Low shedder — next count in fall' },
    { horse: 'Beauty', type: 'dental', title: 'Annual dental float', date: daysAgo(250), next: daysAgo(15), provider: 'Royal Equine Dental', cost: 500, desc: 'OVERDUE — needs scheduling' },
    { horse: 'Beauty', type: 'vet_visit', title: 'Chiropractic adjustment', date: daysAgo(14), provider: 'Dr. Layla Equine Rehab', cost: 650, desc: 'Thoracolumbar adjustment. Improved flexion post-treatment.' },

    // Storm
    { horse: 'Storm', type: 'vaccination', title: 'Strangles intranasal', date: daysAgo(200), next: daysAgo(20), provider: 'Dr. Nasser Al-Fahad', cost: 280, desc: 'OVERDUE — reschedule immediately' },
    { horse: 'Storm', type: 'vaccination', title: 'West Nile virus', date: daysAgo(120), next: daysFromNow(245), provider: 'Dr. Nasser Al-Fahad', cost: 220 },
    { horse: 'Storm', type: 'farrier', title: 'Corrective shoeing — therapeutic', date: daysAgo(35), next: daysFromNow(14), provider: 'Ali Al-Shammari', cost: 650, desc: 'Egg-bar shoes rear, degree pads front for navicular support' },
    { horse: 'Storm', type: 'deworming', title: 'Fall deworming — moxidectin', date: daysAgo(160), next: daysFromNow(20), provider: 'Stable staff', cost: 95 },
    { horse: 'Storm', type: 'vet_visit', title: 'Navicular re-evaluation', date: daysAgo(60), next: daysFromNow(120), provider: 'Dr. Nasser Al-Fahad', cost: 900, desc: 'X-rays stable. Continue current shoeing protocol. Recheck in 6 months.' },
    { horse: 'Storm', type: 'general', title: 'Insurance renewal — submitted', date: daysAgo(15), next: daysFromNow(350), provider: 'Gulf Equine Insurance', cost: 3500 },

    // Majesty
    { horse: 'Majesty', type: 'vaccination', title: 'Core 5-way vaccine', date: daysAgo(25), next: daysFromNow(340), provider: 'Dr. Nasser Al-Fahad', cost: 450 },
    { horse: 'Majesty', type: 'farrier', title: 'Full shoeing — standard', date: daysAgo(14), next: daysFromNow(35), provider: 'Ali Al-Shammari', cost: 400 },
    { horse: 'Majesty', type: 'dental', title: 'First annual dental float', date: daysAgo(180), next: daysFromNow(185), provider: 'Royal Equine Dental', cost: 500 },
    { horse: 'Majesty', type: 'deworming', title: 'Spring deworming — fenbendazole', date: daysAgo(10), next: daysFromNow(170), provider: 'Stable staff', cost: 75 },
    { horse: 'Majesty', type: 'vet_visit', title: 'Growth plate check — young horse', date: daysAgo(90), next: daysFromNow(90), provider: 'Dr. Nasser Al-Fahad', cost: 500, desc: 'Growth plates closing normally. Cleared for increased jump height.' },
    { horse: 'Majesty', type: 'general', title: 'Microchip registration verified', date: daysAgo(100), provider: 'JCSA Registry', cost: 120 },
  ], eliteId, horseIds, adminId);
}

// ── Moka Academy demo data ──

async function seedMokaData(stableIds, disciplineIds, horseIds, adminId) {
  const mokaId = stableIds['Moka Academy'];
  if (!mokaId) return;
  console.log('\n── Seeding Moka Academy demo data ──');

  const coach = await seedCoach({
    email: 'khalid.coach@equora.demo', firstName: 'Khalid', lastName: 'Al-Harbi',
    mobile: '+966500000001', uid: 'demo_coach_khalid', stableId: mokaId,
  });
  const rider = await seedRider({
    email: 'noura.rider@equora.demo', firstName: 'Noura', lastName: 'Al-Rashid',
    mobile: '+966500000002', uid: 'demo_rider_noura',
  });

  const dressageId = disciplineIds['Dressage'];
  if (!dressageId) { console.warn('  Skipping arena — Dressage not found.'); return; }
  const arena = await seedArena({ name: 'Main Arena', stableId: mokaId, disciplineId: dressageId });

  console.log('Seeding Moka bookings...');
  await seedBookings([
    { coachId: coach.id, riderId: rider.id, stableId: mokaId, arenaId: arena.id,
      horseId: horseIds['Liva'], daysOffset: -7, start: '17:00:00', end: '17:45:00', duration: 45, status: 'completed', price: 225 },
    { coachId: coach.id, riderId: rider.id, stableId: mokaId, arenaId: arena.id,
      horseId: horseIds['Sierra'], daysOffset: -3, start: '18:00:00', end: '19:00:00', duration: 60, status: 'completed', price: 300 },
    { coachId: coach.id, riderId: rider.id, stableId: mokaId, arenaId: arena.id,
      horseId: horseIds['Zamzam'], daysOffset: 1, start: '17:30:00', end: '18:15:00', duration: 45, status: 'confirmed', price: 225 },
    { coachId: coach.id, riderId: rider.id, stableId: mokaId, arenaId: arena.id,
      horseId: horseIds['Liva'], daysOffset: 3, start: '19:00:00', end: '19:45:00', duration: 45, status: 'confirmed', price: 225 },
    { coachId: coach.id, riderId: rider.id, stableId: mokaId, arenaId: arena.id,
      horseId: horseIds['Sierra'], daysOffset: 5, start: '18:00:00', end: '18:30:00', duration: 30, status: 'pending_review', price: 175 },
  ]);

  console.log('Seeding Moka horse maintenance...');
  await seedMaintenance([
    { horse: 'Liva', type: 'vaccination', title: 'Tetanus booster', date: daysAgo(60), next: daysFromNow(305), provider: 'Dr. Ahmed Yassin', cost: 250 },
    { horse: 'Liva', type: 'vaccination', title: 'Equine influenza', date: daysAgo(90), next: daysFromNow(90), provider: 'Dr. Ahmed Yassin', cost: 300 },
    { horse: 'Liva', type: 'farrier', title: 'Full shoeing — all four', date: daysAgo(70), next: daysAgo(14), provider: 'Mohammed Al-Farsi', cost: 400, desc: 'Front shoes replaced, rear trimmed' },
    { horse: 'Liva', type: 'dental', title: 'Annual dental float', date: daysAgo(200), next: daysFromNow(165), provider: 'Dr. Samir Equine Clinic', cost: 500 },
    { horse: 'Sierra', type: 'vaccination', title: 'Tetanus + flu combo', date: daysAgo(30), next: daysFromNow(335), provider: 'Dr. Ahmed Yassin', cost: 350 },
    { horse: 'Sierra', type: 'farrier', title: 'Trim and reset — fronts', date: daysAgo(42), next: daysFromNow(7), provider: 'Mohammed Al-Farsi', cost: 350 },
    { horse: 'Sierra', type: 'deworming', title: 'Spring deworming — ivermectin', date: daysAgo(15), next: daysFromNow(165), provider: 'Stable staff', cost: 80 },
    { horse: 'Sierra', type: 'vet_visit', title: 'Lameness check — right front', date: daysAgo(5), provider: 'Dr. Ahmed Yassin', cost: 600, desc: 'Mild strain, 3-day rest recommended. Cleared for light work.' },
    { horse: 'Zamzam', type: 'vaccination', title: 'Strangles vaccine', date: daysAgo(380), next: daysAgo(15), provider: 'Dr. Samir Equine Clinic', cost: 280 },
    { horse: 'Zamzam', type: 'farrier', title: 'Full trim — barefoot', date: daysAgo(35), next: daysFromNow(21), provider: 'Mohammed Al-Farsi', cost: 200 },
    { horse: 'Zamzam', type: 'deworming', title: 'Fall deworming — moxidectin', date: daysAgo(180), next: daysFromNow(0), provider: 'Stable staff', cost: 90 },
    { horse: 'Zamzam', type: 'general', title: 'Microchip implant verified', date: daysAgo(120), provider: 'Dr. Ahmed Yassin', cost: 150 },
  ], mokaId, horseIds, adminId);
}

// ── Enable modules for stables ──

async function enableModules(stableIds, adminId) {
  console.log('\n── Enabling modules ──');
  for (const name of ['Elite Equestrian', 'Moka Academy']) {
    const sId = stableIds[name];
    if (!sId) continue;
    await StableModule.findOrCreate({
      where: { stable_id: sId, module_key: 'horse_maintenance' },
      defaults: { stable_id: sId, module_key: 'horse_maintenance', enabled: true, enabled_by: adminId },
    });
    console.log(`  Enabled horse_maintenance for ${name}`);
  }
}

// ── Main ──

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  try {
    const disciplineIds = await seedDisciplines();
    const stableIds = await seedStables();
    const horseIds = await seedHorses(stableIds, disciplineIds);

    const admin = await Admin.findOne({ where: { role: 'super_admin' } });
    const adminId = admin?.id || null;

    await seedEliteData(stableIds, disciplineIds, horseIds, adminId);
    await seedMokaData(stableIds, disciplineIds, horseIds, adminId);
    await enableModules(stableIds, adminId);

    console.log('\nSeed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
