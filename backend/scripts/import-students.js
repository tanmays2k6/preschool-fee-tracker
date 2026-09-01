import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const studentsToInsert = [
  {
    admission_no: 'FNL-26-09',
    name: 'Aarushi Kumari',
    class: 'PG',
    admission_date: '2022-09-08',
    father_name: 'Rajesh Kumar',
    address: 'Saketpuri, Bazar Samiti',
    phone: '6207004424',
    status: 'active',
  },
  {
    admission_no: 'FNL-25-15',
    name: 'Advik Sinha',
    class: 'PG',
    admission_date: '2023-04-23',
    father_name: 'Divakar Kumar',
    address: 'New Kunj Colony, East Bahadurpur, Patna',
    phone: '9386484824',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-12',
    name: 'Akshita Singh',
    class: 'PG',
    admission_date: '2024-09-04',
    father_name: 'Amit Kumar',
    address: 'Saketpuri, Rajendra Nagar',
    phone: '9113391922',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-05',
    name: 'Ayansh Viraj',
    class: 'PG',
    admission_date: '2023-01-15',
    father_name: 'Mahesh Kumar',
    address: 'Bazar Samiti, Main Gate',
    phone: '9955866415',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-06',
    name: 'Divyansh Kumar',
    class: 'PG',
    admission_date: '2022-10-20',
    father_name: 'Pappu Kumar',
    address: 'Saketpuri, Bazar Samiti, Patna-16',
    phone: '6287253222',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-10',
    name: 'Krishabh Verma',
    class: 'PG',
    admission_date: '2024-02-13',
    father_name: 'Vineet Kumar Verma',
    address: 'Bazar Samiti, Rajendra Nagar',
    phone: '7870237627',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-07',
    name: 'Parth Rana',
    class: 'PG',
    admission_date: '2022-01-22',
    father_name: 'Bikash Singh',
    address: 'Bahadurpur, Bagicha',
    phone: '8470994922',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-04',
    name: 'Pratham Dev',
    class: 'PG',
    admission_date: '2023-12-31',
    father_name: 'Jitendra Kumar',
    address: 'Bazar Samiti, Saketpuri',
    phone: '8936046131',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-03',
    name: 'Rachit Ragav',
    class: 'PG',
    admission_date: '2022-08-04',
    father_name: 'Doorohan Kumar Dulit',
    address: 'New Kunj Colony, Bazar Samiti, Patna-16',
    phone: '9911613555',
    status: 'active',
  },
  {
    admission_no: 'FNL-25-10',
    name: 'Reyan Sinha',
    class: 'PG',
    admission_date: '2023-03-21',
    father_name: 'Ravindra Kumar',
    address: 'Rajendra Nagar, Bahadurpur',
    phone: '8409329869',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-15',
    name: 'Shanvi Kumari',
    class: 'PG',
    admission_date: '2022-11-19',
    father_name: 'Nishant Kumar',
    address: 'New Kunj Colony, East Bahadurpur, Patna-16',
    phone: '9060354572',
    status: 'active',
  },
];

async function insertStudents() {
  console.log('Inserting/updating students in Supabase...');

  for (const student of studentsToInsert) {
    const { data: existing, error: findError } = await supabase
      .from('students')
      .select('id, admission_no')
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
        console.log(`Updated ${student.admission_no} (${student.name})`);
      }
    } else {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select();

      if (error) {
        console.error(`Error inserting ${student.admission_no}:`, error.message);
      } else {
        console.log(`Inserted ${student.admission_no} (${student.name})`);
      }
    }
  }

  console.log('Finished processing student records.');
}

insertStudents();
