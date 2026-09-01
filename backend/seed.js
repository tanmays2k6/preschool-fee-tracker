import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import userService from './services/userService.js';
import settingsService from './services/settingsService.js';
import supabase from './config/supabase.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('--- Starting Supabase Seed Process ---');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in .env'
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // 1. Check if admin user already exists
    const existingAdmin = await userService.findByEmail(adminEmail);

    if (existingAdmin) {
      console.log(`ℹ️ Admin user (${adminEmail}) already exists in Supabase!`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await userService.createUser({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: 'admin',
      });

      console.log(`✅ Admin user created successfully: ${adminEmail}`);
    }

    // 2. Ensure initial settings record exists
    const settings = await settingsService.getSettings();
    console.log(`✅ Settings initialized with Prefix: "${settings.receiptPrefix}" & Session: "${settings.academicSession}"`);

    console.log('--- Seed Completed Successfully ---');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
