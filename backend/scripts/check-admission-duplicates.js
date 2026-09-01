import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

async function checkAdmissionNumbers() {
  const { data: students, error } = await supabase
    .from('students')
    .select('id, name, admission_no, class, father_name')
    .ilike('admission_no', '%FNL-25-10%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${students.length} students with FNL-25-10 in admission_no:`);
  for (const s of students) {
    console.log(`- ID: ${s.id}, Name: ${s.name}, Class: ${s.class}, AdmNo: ${s.admission_no}, Father: ${s.father_name}`);
  }

  // Also list all admission numbers to check for duplicates
  const { data: allStudents } = await supabase
    .from('students')
    .select('id, name, admission_no, class');

  const admMap = new Map();
  console.log(`\nChecking all ${allStudents?.length || 0} students for admission number duplicates:`);
  for (const s of allStudents || []) {
    if (admMap.has(s.admission_no)) {
      console.log(`⚠️ DUPLICATE DETECTED: "${s.admission_no}" used by:`);
      console.log(`   1) ${admMap.get(s.admission_no).name} (${admMap.get(s.admission_no).class}) [ID: ${admMap.get(s.admission_no).id}]`);
      console.log(`   2) ${s.name} (${s.class}) [ID: ${s.id}]`);
    } else {
      admMap.set(s.admission_no, s);
    }
  }
}

checkAdmissionNumbers();
