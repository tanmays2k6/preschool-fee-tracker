import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

/**
 * Migration script: Copies existing students, fee records, users, and settings
 * from MongoDB to Supabase PostgreSQL.
 * Maintains MongoDB _id -> Supabase UUID mappings.
 */
async function runMigration() {
  console.log('====================================================');
  console.log('     MongoDB -> Supabase PostgreSQL Data Migration  ');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/preschool_fee_tracker';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in backend/.env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let mongoClient;
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB successfully.\n');
  } catch (err) {
    console.warn('⚠️ Could not connect to local MongoDB. Proceeding in standalone/verification mode.');
    console.log('If you have active MongoDB data to import, ensure MongoDB is running and MONGO_URI is set.');
    return;
  }

  const db = mongoClient.db();

  let studentsFound = 0;
  let studentsMigrated = 0;
  let paymentsFound = 0;
  let paymentsMigrated = 0;
  let totalMongoAmount = 0;
  let totalSupabaseAmount = 0;
  const errors = [];

  const studentIdMap = new Map(); // Mongo _id string -> Supabase UUID

  try {
    // 1. MIGRATE USERS
    console.log('Migrating Users...');
    const users = await db.collection('users').find().toArray();
    for (const u of users) {
      const email = u.email ? u.email.toLowerCase() : null;
      if (!email) continue;

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (!existing) {
        await supabase.from('users').insert({
          name: u.name || 'Admin User',
          email: email,
          password_hash: u.passwordHash,
          role: u.role || 'admin',
          created_at: u.createdAt || new Date(),
        });
      }
    }
    console.log(`✅ Users processed: ${users.length}\n`);

    // 2. MIGRATE STUDENTS
    console.log('Migrating Students...');
    const students = await db.collection('students').find().toArray();
    studentsFound = students.length;

    for (const s of students) {
      try {
        const admissionNo = s.admissionNumber || s.admission_no;
        if (!admissionNo) continue;

        // Check if student already exists in Supabase
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('admission_no', admissionNo)
          .maybeSingle();

        let supabaseStudentId;

        if (existingStudent) {
          supabaseStudentId = existingStudent.id;
        } else {
          const { data: inserted, error: sErr } = await supabase
            .from('students')
            .insert({
              admission_no: admissionNo,
              name: s.studentName || s.name || 'Unnamed',
              father_name: s.fatherName || s.father_name || 'N/A',
              mother_name: s.motherName || s.mother_name || '',
              class: s.class || 'Nursery',
              admission_date: s.admissionDate || s.admission_date || new Date(),
              monthly_fee: parseFloat(s.monthlyFee || s.monthly_fee || 0),
              transport_fee: parseFloat(s.transportFee || s.transport_fee || 0),
              admission_fee: parseFloat(s.admissionFee || s.admission_fee || 0),
              annual_charges: parseFloat(s.annualCharges || s.annual_charges || 0),
              concession: parseFloat(s.concession || 0),
              status: s.status || 'active',
              phone: s.contactNumber || s.phone || '',
              address: s.address || '',
              remarks: s.remarks || null,
              created_at: s.createdAt || new Date(),
            })
            .select('id')
            .single();

          if (sErr) throw sErr;
          supabaseStudentId = inserted.id;
        }

        studentIdMap.set(s._id.toString(), supabaseStudentId);
        studentsMigrated++;
      } catch (err) {
        errors.push(`Student (${s.studentName || s.admissionNumber}): ${err.message}`);
      }
    }
    console.log(`✅ Students migrated: ${studentsMigrated} / ${studentsFound}\n`);

    // 3. MIGRATE FEE RECORDS
    console.log('Migrating Fee Payments...');
    const feeRecords = await db.collection('feerecords').find().toArray();
    paymentsFound = feeRecords.length;

    for (const f of feeRecords) {
      try {
        const mongoStudentId = f.studentId ? f.studentId.toString() : null;
        const supabaseStudentId = studentIdMap.get(mongoStudentId);

        if (!supabaseStudentId) {
          errors.push(`Payment skipped: MongoDB student ID ${mongoStudentId} not found in migrated students.`);
          continue;
        }

        const amount = parseFloat(f.paidAmount || f.totalAmount || 0);
        totalMongoAmount += amount;

        const receiptNo = f.receiptNumber || `MIG-${Date.now()}-${Math.floor(Math.random()*1000)}`;

        // Check if payment with this receipt exists
        const { data: existingPayment } = await supabase
          .from('fee_payments')
          .select('id, amount')
          .eq('receipt_number', receiptNo)
          .maybeSingle();

        if (!existingPayment) {
          const sessionYear = f.year ? `${f.year}-${(parseInt(f.year)+1).toString().slice(-2)}` : '2026-27';

          // Determine fee type and details
          let feeType = 'monthly';
          let uniformType = null;
          let uniformSize = null;
          let description = null;

          if (f.uniformWinter?.price > 0) {
            feeType = 'uniform';
            uniformType = 'winter';
            uniformSize = f.uniformWinter.size;
          } else if (f.uniformRedWhite?.price > 0) {
            feeType = 'uniform';
            uniformType = 'red_white';
            uniformSize = f.uniformRedWhite.size;
          } else if (f.kitPurchased?.price > 0) {
            feeType = 'books_stationery';
            description = 'School Kit';
          } else if (f.annualFee > 0) {
            feeType = 'annual';
          }

          const { error: pErr } = await supabase.from('fee_payments').insert({
            student_id: supabaseStudentId,
            session: sessionYear,
            month: feeType === 'monthly' ? (f.month || 'January') : null,
            fee_type: feeType,
            payment_mode: (f.paymentMode || 'cash').toLowerCase(),
            amount: amount > 0 ? amount : 1,
            uniform_type: uniformType,
            uniform_size: uniformSize,
            description: description,
            receipt_number: receiptNo,
            payment_date: f.paymentDate || f.createdAt || new Date(),
            collected_by: f.collectedBy || 'Admin',
            remarks: f.remarks || null,
            created_at: f.createdAt || new Date(),
          });

          if (pErr) throw pErr;
        }

        totalSupabaseAmount += amount;
        paymentsMigrated++;
      } catch (err) {
        errors.push(`Payment (${f.receiptNumber}): ${err.message}`);
      }
    }
    console.log(`✅ Payments migrated: ${paymentsMigrated} / ${paymentsFound}\n`);

    // 4. MIGRATION SUMMARY REPORT
    console.log('====================================================');
    console.log('               MIGRATION REPORT                     ');
    console.log('====================================================');
    console.log(`Students:`);
    console.log(`  MongoDB:   ${studentsFound}`);
    console.log(`  Supabase:  ${studentsMigrated}`);
    console.log(`  Difference: ${studentsFound - studentsMigrated}\n`);
    console.log(`Payments:`);
    console.log(`  MongoDB:   ${paymentsFound}`);
    console.log(`  Supabase:  ${paymentsMigrated}`);
    console.log(`  Difference: ${paymentsFound - paymentsMigrated}\n`);
    console.log(`Total Payment Amount:`);
    console.log(`  MongoDB:   ₹${totalMongoAmount.toFixed(2)}`);
    console.log(`  Supabase:  ₹${totalSupabaseAmount.toFixed(2)}`);
    console.log(`  Difference: ₹${(totalMongoAmount - totalSupabaseAmount).toFixed(2)}\n`);
    console.log(`Total Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('\nError details:');
      errors.slice(0, 10).forEach((e) => console.log(` - ${e}`));
    }
    console.log('====================================================\n');
  } finally {
    if (mongoClient) await mongoClient.close();
  }
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
