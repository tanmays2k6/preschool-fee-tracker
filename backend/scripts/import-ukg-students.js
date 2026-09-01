import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const ukgStudents = [
  {
    admission_no: 'FNL-22-22',
    name: 'Aayush Kumar',
    class: 'UKG',
    admission_date: '2022-10-01',
    father_name: 'Akash Kumar',
    mother_name: 'Priyanka Kumari',
    address: 'Daudbigha, Bhutnath Road, Patna',
    phone: '8205961997',
    status: 'active',
  },
  {
    admission_no: 'FNL-23-17',
    name: 'Shreyansh Chourasiya',
    class: 'UKG',
    admission_date: '2019-09-20',
    father_name: 'Sanjit Kumar',
    mother_name: 'Sushila Kumari',
    address: 'New Kunj Colony, Bahadurpur, near NMCH Railway Crossing',
    phone: '6200701579',
    status: 'active',
  },
  {
    admission_no: 'FNL-23-21',
    name: 'Ruhani',
    class: 'UKG',
    admission_date: '2020-10-26',
    father_name: 'Rahul Gupta',
    mother_name: 'Gayatri Kumari',
    address: 'Bazar Samiti, R.P. Mission School',
    phone: '8789665209',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-06',
    name: 'Aditya',
    class: 'UKG',
    admission_date: '2020-01-17',
    father_name: 'Abhishek Rajan',
    mother_name: 'Nidhi Nupur',
    address: 'C/O Rakesh Kumar Sinha, New Kunj Colony, East Bahadurpur',
    phone: '8271641617',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-09',
    name: 'Divyam Rishikesh',
    class: 'UKG',
    admission_date: '2020-12-25',
    father_name: 'Amit Rajan',
    mother_name: 'Sonam Singh',
    address: 'Sanjay-Sanjiv Sadan, Saketpuri, Bazar Samiti',
    phone: '9835336827',
    status: 'active',
  },
];

async function insertUKGStudents() {
  console.log('Inserting/updating UKG students in Supabase...');

  for (const student of ukgStudents) {
    const { data: existing, error: findError } = await supabase
      .from('students')
      .select('id, admission_no, name')
      .eq('admission_no', student.admission_no)
      .maybeSingle();

    if (findError) {
      console.error(`Error querying ${student.admission_no}:`, findError.message);
      continue;
    }

    if (existing) {
      const { data, error } = await supabase
        .from('students')
        .update(student)
        .eq('id', existing.id)
        .select();

      if (error) {
        console.error(`Error updating ${student.admission_no}:`, error.message);
      } else {
        console.log(`✅ Updated ${student.admission_no} (${student.name})`);
      }
    } else {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select();

      if (error) {
        console.error(`Error inserting ${student.admission_no}:`, error.message);
      } else {
        console.log(`✅ Inserted ${student.admission_no} (${student.name})`);
      }
    }
  }

  console.log('Finished processing UKG students.');
}

insertUKGStudents();
