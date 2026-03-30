/**
 * One-time cleanup script: Delete test accounts + fix phone number formats
 *
 * Run with: node scripts/cleanup-test-data.js
 *
 * This script:
 * 1. Deletes test accounts (created via bypass OTP with test emails)
 * 2. Fixes phone numbers to include +966 prefix where missing
 * 3. Reports all changes made
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database.js';
import '../models/index.js';
import { deleteCoach } from '../services/coach.service.js';

const TEST_EMAIL_PATTERNS = [
  '%@equora.test',
  '%bypass_%@firebase.local',
];

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // 1. Find and delete test coaches
    console.log('\n=== STEP 1: Delete test coaches ===');
    const [testCoaches] = await sequelize.query(`
      SELECT id, email, mobile_number, first_name, last_name, firebase_uid
      FROM user
      WHERE role = 'coach' AND (
        email LIKE '%@equora.test'
        OR email LIKE '%@firebase.local'
        OR firebase_uid LIKE 'bypass_%'
        OR (first_name IS NULL AND last_name IS NULL AND email IS NULL)
      )
    `);

    console.log(`Found ${testCoaches.length} test coaches to delete:`);
    for (const coach of testCoaches) {
      console.log(`  ID:${coach.id} | ${coach.first_name || 'none'} ${coach.last_name || ''} | ${coach.email || 'no email'} | ${coach.mobile_number || 'no phone'}`);
      try {
        await deleteCoach(coach.id);
        console.log(`  ✓ Deleted coach ID ${coach.id}`);
      } catch (e) {
        console.log(`  ✗ Failed to delete coach ID ${coach.id}: ${e.message}`);
      }
    }

    // 2. Find and delete test riders
    console.log('\n=== STEP 2: Delete test riders ===');
    const [testRiders] = await sequelize.query(`
      SELECT id, email, mobile_number, first_name, last_name, firebase_uid
      FROM user
      WHERE role = 'rider' AND (
        email LIKE '%@equora.test'
        OR email LIKE '%@firebase.local'
        OR firebase_uid LIKE 'bypass_%'
      )
    `);

    console.log(`Found ${testRiders.length} test riders to delete:`);
    for (const rider of testRiders) {
      console.log(`  ID:${rider.id} | ${rider.first_name || 'none'} ${rider.last_name || ''} | ${rider.email || 'no email'}`);
      try {
        await sequelize.query(`DELETE FROM user WHERE id = :id`, { replacements: { id: rider.id } });
        console.log(`  ✓ Deleted rider ID ${rider.id}`);
      } catch (e) {
        console.log(`  ✗ Failed to delete rider ID ${rider.id}: ${e.message}`);
      }
    }

    // 3. Delete test admin accounts (stable_owner bypass accounts)
    console.log('\n=== STEP 3: Delete test admin accounts ===');
    const [testAdmins] = await sequelize.query(`
      SELECT id, email, mobile_number, first_name, last_name, firebase_uid
      FROM admin
      WHERE firebase_uid LIKE 'bypass_%'
        OR email LIKE '%@firebase.local'
    `);

    console.log(`Found ${testAdmins.length} test admin accounts to delete:`);
    for (const admin of testAdmins) {
      console.log(`  ID:${admin.id} | ${admin.email} | ${admin.mobile_number || 'no phone'}`);
      try {
        // Unlink stables first
        await sequelize.query(`UPDATE stables SET admin_id = NULL WHERE admin_id = :id`, { replacements: { id: admin.id } });
        await sequelize.query(`DELETE FROM admin WHERE id = :id`, { replacements: { id: admin.id } });
        console.log(`  ✓ Deleted admin ID ${admin.id}`);
      } catch (e) {
        console.log(`  ✗ Failed to delete admin ID ${admin.id}: ${e.message}`);
      }
    }

    // 4. Fix phone number formats (add +966 prefix)
    console.log('\n=== STEP 4: Fix phone number formats ===');
    const [usersWithOldFormat] = await sequelize.query(`
      SELECT id, mobile_number, first_name, last_name, email, role
      FROM user
      WHERE mobile_number IS NOT NULL
        AND mobile_number != ''
        AND mobile_number NOT LIKE '+%'
    `);

    console.log(`Found ${usersWithOldFormat.length} users with phone numbers missing country code:`);
    for (const user of usersWithOldFormat) {
      let newPhone = user.mobile_number;
      // Remove leading 0 and add +966
      if (newPhone.startsWith('0')) {
        newPhone = '+966' + newPhone.substring(1);
      } else if (newPhone.length <= 10 && !newPhone.startsWith('+')) {
        newPhone = '+966' + newPhone;
      }

      console.log(`  ID:${user.id} | ${user.first_name || ''} ${user.last_name || ''} | ${user.mobile_number} → ${newPhone}`);
      try {
        await sequelize.query(
          `UPDATE user SET mobile_number = :newPhone WHERE id = :id`,
          { replacements: { newPhone, id: user.id } }
        );
        console.log(`  ✓ Updated`);
      } catch (e) {
        console.log(`  ✗ Failed: ${e.message}`);
      }
    }

    // 5. Summary
    console.log('\n=== SUMMARY ===');
    const [remainingUsers] = await sequelize.query(`
      SELECT id, first_name, last_name, email, mobile_number, role
      FROM user
      ORDER BY id
    `);
    console.log(`Remaining users: ${remainingUsers.length}`);
    for (const u of remainingUsers) {
      console.log(`  ID:${u.id} | ${u.role:5} | ${(u.first_name || '') + ' ' + (u.last_name || '')} | Phone:${u.mobile_number || 'none'} | Email:${u.email || 'none'}`);
    }

    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (e) {
    console.error('Cleanup failed:', e.message);
    process.exit(1);
  }
};

run();
