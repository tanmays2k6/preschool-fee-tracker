import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const nurseryStudents = [
  {
    admission_no: 'FNL-25-14',
    name: 'Aadvik Ranjan',
    class: 'NUR',
    admission_date: '2022-09-10',
    father_name: 'Atul Ranjan',
    mother_name: 'Raj Nandini Patel',
    address: 'New Kunj Colony,Bahadurpur, Bazar Samiti, Patna',
    phone: '7004217147',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-26-01',
    name: 'Aashi Singh',
    class: 'NUR',
    admission_date: '2020-06-27',
    father_name: 'Vikas Singh',
    mother_name: 'Cinni Singh',
    address: 'Ram Pyari Singh, South of Bazar Samiti, Saketpuri',
    phone: '8936896446',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-26-11',
    name: 'Devanshi',
    class: 'NUR',
    admission_date: '2023-02-15',
    father_name: 'Sujit Kumar Singh',
    mother_name: 'Madhu Kumari',
    address: 'New Kunj Colony,Bahadurpur, Bazar Samiti, Patna',
    phone: '8210587093',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-09',
    name: 'Krishna',
    class: 'NUR',
    admission_date: new Date().toISOString().split('T')[0],
    father_name: 'Rajesh Kumar',
    mother_name: 'Rajshree Yadav',
    address: 'North Saketpuri, Bazar Samiti, Patna',
    phone: '9430271981',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-10-NUR',
    name: 'Kristi Sinha',
    class: 'NUR',
    admission_date: '2023-08-30',
    father_name: 'Kavindra Kumar',
    mother_name: 'Dipti Raj',
    address: 'Bahadurpur, Bagicha, Rajendra Nagar',
    phone: '7633013547',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-12',
    name: 'Kriti Kumari',
    class: 'NUR',
    admission_date: '2022-05-28',
    father_name: 'Ganesh Kumar',
    mother_name: 'Chandrika Kumari',
    address: 'Urmila Sadan, New Kunj Colony, Bazar Samiti, Patna-16',
    phone: '9693087117',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-04',
    name: 'Saksham Verma',
    class: 'NUR',
    admission_date: '2022-06-24',
    father_name: 'Pankaj Verma',
    mother_name: 'Mamta Kumari',
    address: 'Bazar Samiti, Dev Ashram, Mathura Gali',
    phone: '7488599769',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-03',
    name: 'Shivansh Raj',
    class: 'NUR',
    admission_date: '2022-06-21',
    father_name: 'Sujeet Kumar',
    mother_name: 'Shweta Verma',
    address: 'Bazar Samiti',
    phone: '9304112844',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-20-01',
    name: 'Shivanshi Raj',
    class: 'NUR',
    admission_date: '2018-11-30',
    father_name: 'Ashok kumar',
    mother_name: 'Sampada Devi',
    address: 'Bazar Samiti,Saketpuri,Patna',
    phone: '9835274964',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-08-NUR',
    name: 'Shreyansh Kumar',
    class: 'NUR',
    admission_date: new Date().toISOString().split('T')[0],
    father_name: 'Raju Kumar',
    mother_name: 'Khusboo Kumari',
    address: 'Shivshakti Nagar, Road No., Bahadurpur, Bazar Samiti',
    phone: '6201075900',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
  {
    admission_no: 'FNL-25-02',
    name: 'Utkarsh Kumar',
    class: 'NUR',
    admission_date: '2021-08-24',
    father_name: 'Chandan Kumar',
    mother_name: 'Sweta Kumari',
    address: 'Saketpuri, Bazar Samiti, Near Pani Tanki',
    phone: '9102405056',
    monthly_fee: 1350,
    annual_charges: 3000,
    status: 'active',
  },
];

async function insertNurseryStudents() {
  console.log('Inserting/updating Nursery students in Supabase...');

  for (const student of nurseryStudents) {
    const { data: existing, error: findError } = await supabase
      .from('students')
      .select('id, admission_no, name')
      .eq('name', student.name)
      .eq('father_name', student.father_name)
      .limit(1);

    if (findError) {
      console.error(`Error querying ${student.name}:`, findError.message);
    }

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('students')
        .update(student)
        .eq('id', existing[0].id);

      if (error) {
        console.error(`Error updating ${student.name}:`, error.message);
      } else {
        console.log(`✅ Updated ${student.admission_no} (${student.name})`);
      }
    } else {
      const { error } = await supabase
        .from('students')
        .insert(student);

      if (error) {
        console.error(`Error inserting ${student.name}:`, error.message);
      } else {
        console.log(`✅ Inserted ${student.admission_no} (${student.name})`);
      }
    }
  }

  console.log('Finished processing Nursery student records.');
}

insertNurseryStudents();
