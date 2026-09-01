import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const lkgStudents = [
  {
    admission_no: 'FNL-25-01',
    name: 'Aadhya Abha',
    class: 'LKG',
    admission_date: '2022-12-31',
    father_name: 'Jitendra Kumar',
    mother_name: 'Jyoti Kumari',
    address: 'Bazar Samiti, Saketpuri',
    phone: '8936046131',
    status: 'active',
  },
  {
    admission_no: 'FNL-25-05',
    name: 'Anurag Gautam',
    class: 'LKG',
    admission_date: '2020-02-03',
    father_name: 'Pradeep Kumar',
    mother_name: 'Mona Kumari',
    address: 'Saketpuri, Bazar Samiti, Patna-16',
    phone: '9334163048',
    status: 'active',
  },
  {
    admission_no: 'FNL-26-08',
    name: 'Arunoday Sinha',
    class: 'LKG',
    admission_date: '2021-12-14',
    father_name: 'Prakash Kumar',
    mother_name: 'Reshmi Kumari',
    address: 'New Kunj Colony, Cooperative Bazar Samiti',
    phone: '7251004511',
    status: 'active',
  },
  {
    admission_no: 'FNL-25-06',
    name: 'Ashutosh Kumar',
    class: 'LKG',
    admission_date: '2020-11-18',
    father_name: 'Suman Saurabh',
    mother_name: 'Rekha Kumari',
    address: 'Rizwan, P.O. Ushaawan, Atharwan, Dist. Nalanda 811103',
    phone: '7667166239',
    status: 'active',
  },
  {
    admission_no: 'FNL-25-13',
    name: 'Medansh',
    class: 'LKG',
    admission_date: '2021-07-21',
    father_name: 'Vishal Anand',
    mother_name: 'Priyanka Kumari',
    address: 'New Kunj Colony, Bazar Samiti',
    phone: '9110054588',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-12',
    name: 'Nishidha Singh',
    class: 'LKG',
    admission_date: '2022-03-23',
    father_name: 'Gaurav Kumar',
    mother_name: 'Pooja Kumari',
    address: 'Rampur Road, Near Bazar Samiti Main Gate',
    phone: '9334994680',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-02',
    name: 'Prisha Prabhakar',
    class: 'LKG',
    admission_date: '2022-04-22',
    father_name: 'Prabhakar Kumar',
    mother_name: 'Priyanka Kumari',
    address: 'New Kunj Colony, East Bahadurpur',
    phone: '7004300323',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-14',
    name: 'Saanvi Singh',
    class: 'LKG',
    admission_date: '2023-08-22',
    father_name: 'Jay Prakash Naryan',
    mother_name: 'Puja Kumari',
    address: 'New Kunj Colony, Near Railway Line, Bazar Samiti',
    phone: '6200296632',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-07',
    name: 'Shanvi Kumari',
    class: 'LKG',
    admission_date: new Date().toISOString().split('T')[0],
    father_name: 'Pankaj Kumar',
    mother_name: 'Sweta Kumari',
    address: 'Saketpuri, Bazar Samiti',
    phone: '9576697538',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-08',
    name: 'Shivansh Kumar',
    class: 'LKG',
    admission_date: new Date().toISOString().split('T')[0],
    father_name: 'Raju Kumar',
    mother_name: 'Khusboo Kumari',
    address: 'Shivshakti Nagar, Road No.1, Bahadurpur, Bazar Samiti',
    phone: '6201075900',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-14-2',
    name: 'Shriya Singh',
    class: 'LKG',
    admission_date: '2023-08-22',
    father_name: 'Jay Prakash Naryan',
    mother_name: 'Puja Kumari',
    address: 'New Kunj Colony, Near Railway Line, Bazar Samiti',
    phone: '6200296632',
    status: 'active',
  },
  {
    admission_no: 'FNL-24-04',
    name: 'Siddhiksha',
    class: 'LKG',
    admission_date: '2020-06-18',
    father_name: 'Praveen Kumar',
    mother_name: 'Pratima Kumari',
    address: 'Panchwati Nagar, South of Bazar Samiti',
    phone: '8102523175',
    status: 'active',
  },
  {
    admission_no: 'FNL-25-08',
    name: 'Srinika Singh',
    class: 'LKG',
    admission_date: '2021-07-31',
    father_name: 'Sudhanshu Kumar Singh',
    mother_name: 'Megha Priyadarshi',
    address: 'Saketpuri, East Old Bahadurpur (Near Rajeev Ranjan Chemistry Coaching)',
    phone: '8825103776',
    status: 'active',
  },
];

async function insertLKGStudents() {
  console.log('Inserting/updating LKG students in Supabase...');

  for (const student of lkgStudents) {
    // Check if matching student by name and father's name or admission_no exists
    const { data: existing, error: findError } = await supabase
      .from('students')
      .select('id, admission_no, name')
      .or(`admission_no.eq.${student.admission_no},and(name.eq."${student.name}",father_name.eq."${student.father_name}")`)
      .limit(1);

    if (findError) {
      console.error(`Error querying ${student.name}:`, findError.message);
    }

    if (existing && existing.length > 0) {
      const { data, error } = await supabase
        .from('students')
        .update(student)
        .eq('id', existing[0].id)
        .select();

      if (error) {
        console.error(`Error updating ${student.name}:`, error.message);
      } else {
        console.log(`Updated ${student.admission_no} (${student.name})`);
      }
    } else {
      const { data, error } = await supabase
        .from('students')
        .insert(student)
        .select();

      if (error) {
        console.error(`Error inserting ${student.name}:`, error.message);
      } else {
        console.log(`Inserted ${student.admission_no} (${student.name})`);
      }
    }
  }

  console.log('Finished processing LKG student records.');
}

insertLKGStudents();
