import { loadConfig } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { createDatabase } from '../src/config/database.js';
import { createInstitutionModels } from '../src/modules/institutions/institutions.models.js';

// Strictly INSERT-ONLY seeding script for master educational taxonomies and dropdowns.
// Uses $setOnInsert for ALL fields (including parentIds) so existing records and any
// future staff customizations are NEVER overwritten.
// Usage: node --env-file=.env scripts/seed-taxonomies.js

const BOARDS = [
  { key: 'cbse', label: 'CBSE', sortOrder: 1 },
  { key: 'icse-isc', label: 'ICSE / ISC', sortOrder: 2 },
  { key: 'up-board', label: 'UP Board', sortOrder: 3 },
  { key: 'bseb', label: 'Bihar Board (BSEB)', sortOrder: 4 },
  { key: 'msbshse', label: 'Maharashtra State Board', sortOrder: 5 },
  { key: 'rbse', label: 'Rajasthan Board (RBSE)', sortOrder: 6 },
  { key: 'mpbse', label: 'MP Board', sortOrder: 7 },
  { key: 'nios', label: 'NIOS (Open Schooling)', sortOrder: 8 },
  { key: 'other-state-board', label: 'Other State Board', sortOrder: 9 },
];

const CLASSES = [
  { key: 'class-6', label: '6th', sortOrder: 1 },
  { key: 'class-7', label: '7th', sortOrder: 2 },
  { key: 'class-8', label: '8th', sortOrder: 3 },
  { key: 'class-9', label: '9th', sortOrder: 4 },
  { key: 'class-10', label: '10th', sortOrder: 5 },
  { key: 'class-11', label: '11th', sortOrder: 6 },
  { key: 'class-12', label: '12th', sortOrder: 7 },
  { key: 'undergraduate-ug', label: 'Undergraduate (UG)', sortOrder: 8 },
  { key: 'postgraduate-pg', label: 'Postgraduate (PG)', sortOrder: 9 },
  { key: 'diploma', label: 'Diploma / Polytechnic', sortOrder: 10 },
];

const SUBJECTS = [
  { key: 'mathematics', label: 'Mathematics', sortOrder: 1, scope: 'all' },
  { key: 'science', label: 'Science', sortOrder: 2, scope: 'school_all' },
  { key: 'physics', label: 'Physics', sortOrder: 3, scope: 'secondary_higher' },
  { key: 'chemistry', label: 'Chemistry', sortOrder: 4, scope: 'secondary_higher' },
  { key: 'biology', label: 'Biology', sortOrder: 5, scope: 'secondary_higher' },
  { key: 'english', label: 'English', sortOrder: 6, scope: 'all' },
  { key: 'hindi', label: 'Hindi', sortOrder: 7, scope: 'all' },
  { key: 'social-science', label: 'Social Science', sortOrder: 8, scope: 'school_all' },
  { key: 'computer-science-it', label: 'Computer Science / IT', sortOrder: 9, scope: 'all' },
  { key: 'history', label: 'History', sortOrder: 10, scope: 'all' },
  { key: 'geography', label: 'Geography', sortOrder: 11, scope: 'all' },
  { key: 'accountancy', label: 'Accountancy', sortOrder: 12, scope: 'senior_college' },
  { key: 'business-studies', label: 'Business Studies', sortOrder: 13, scope: 'senior_college' },
  { key: 'economics', label: 'Economics', sortOrder: 14, scope: 'secondary_higher' },
  { key: 'general-knowledge', label: 'General Knowledge & Current Affairs', sortOrder: 15, scope: 'all' },
];

const LANGUAGES = [
  { key: 'english', label: 'English', sortOrder: 1 },
  { key: 'hindi', label: 'Hindi', sortOrder: 2 },
  { key: 'hinglish', label: 'Hinglish (Hindi + English)', sortOrder: 3 },
  { key: 'bengali', label: 'Bengali', sortOrder: 4 },
  { key: 'marathi', label: 'Marathi', sortOrder: 5 },
  { key: 'tamil', label: 'Tamil', sortOrder: 6 },
  { key: 'telugu', label: 'Telugu', sortOrder: 7 },
  { key: 'urdu', label: 'Urdu', sortOrder: 8 },
];

const COURSE_CATEGORIES = [
  { key: 'school-academics', label: 'School Academics (Class 6-10)', sortOrder: 1 },
  { key: 'board-exam-prep', label: 'Board Exam Preparation (10th & 12th)', sortOrder: 2 },
  { key: 'jee-engineering', label: 'Engineering Entrance (JEE Main & Advanced)', sortOrder: 3 },
  { key: 'neet-medical', label: 'Medical Entrance (NEET)', sortOrder: 4 },
  { key: 'cuet-ug-pg', label: 'CUET Entrance Prep', sortOrder: 5 },
  { key: 'govt-ssc-banking', label: 'Government & Banking Exams', sortOrder: 6 },
  { key: 'computer-digital-skills', label: 'Computer & Digital Skills', sortOrder: 7 },
  { key: 'professional-cert', label: 'Professional Certifications', sortOrder: 8 },
];

const PROGRAMS = [
  { key: 'secondary-school', label: 'Secondary School (Class 9-10)', sortOrder: 1 },
  { key: 'senior-secondary', label: 'Senior Secondary (Class 11-12)', sortOrder: 2 },
  { key: 'btech', label: 'Bachelor of Technology (B.Tech)', sortOrder: 3 },
  { key: 'bsc', label: 'Bachelor of Science (B.Sc)', sortOrder: 4 },
  { key: 'bcom', label: 'Bachelor of Commerce (B.Com)', sortOrder: 5 },
  { key: 'ba', label: 'Bachelor of Arts (B.A)', sortOrder: 6 },
  { key: 'bca', label: 'Bachelor of Computer Applications (BCA)', sortOrder: 7 },
  { key: 'bba', label: 'Bachelor of Business Administration (BBA)', sortOrder: 8 },
  { key: 'mca', label: 'Master of Computer Applications (MCA)', sortOrder: 9 },
  { key: 'mba', label: 'Master of Business Administration (MBA)', sortOrder: 10 },
  { key: 'polytechnic-diploma', label: 'Polytechnic Engineering Diploma', sortOrder: 11 },
];

// All 28 States + 8 Union Territories of India (36 total)
const STATES = [
  { key: 'andhra-pradesh', label: 'Andhra Pradesh', sortOrder: 1 },
  { key: 'arunachal-pradesh', label: 'Arunachal Pradesh', sortOrder: 2 },
  { key: 'assam', label: 'Assam', sortOrder: 3 },
  { key: 'bihar', label: 'Bihar', sortOrder: 4 },
  { key: 'chhattisgarh', label: 'Chhattisgarh', sortOrder: 5 },
  { key: 'delhi', label: 'Delhi (NCT)', sortOrder: 6 },
  { key: 'goa', label: 'Goa', sortOrder: 7 },
  { key: 'gujarat', label: 'Gujarat', sortOrder: 8 },
  { key: 'haryana', label: 'Haryana', sortOrder: 9 },
  { key: 'himachal-pradesh', label: 'Himachal Pradesh', sortOrder: 10 },
  { key: 'jammu-and-kashmir', label: 'Jammu and Kashmir', sortOrder: 11 },
  { key: 'jharkhand', label: 'Jharkhand', sortOrder: 12 },
  { key: 'karnataka', label: 'Karnataka', sortOrder: 13 },
  { key: 'kerala', label: 'Kerala', sortOrder: 14 },
  { key: 'ladakh', label: 'Ladakh', sortOrder: 15 },
  { key: 'madhya-pradesh', label: 'Madhya Pradesh', sortOrder: 16 },
  { key: 'maharashtra', label: 'Maharashtra', sortOrder: 17 },
  { key: 'manipur', label: 'Manipur', sortOrder: 18 },
  { key: 'meghalaya', label: 'Meghalaya', sortOrder: 19 },
  { key: 'mizoram', label: 'Mizoram', sortOrder: 20 },
  { key: 'nagaland', label: 'Nagaland', sortOrder: 21 },
  { key: 'odisha', label: 'Odisha', sortOrder: 22 },
  { key: 'punjab', label: 'Punjab', sortOrder: 23 },
  { key: 'rajasthan', label: 'Rajasthan', sortOrder: 24 },
  { key: 'sikkim', label: 'Sikkim', sortOrder: 25 },
  { key: 'tamil-nadu', label: 'Tamil Nadu', sortOrder: 26 },
  { key: 'telangana', label: 'Telangana', sortOrder: 27 },
  { key: 'tripura', label: 'Tripura', sortOrder: 28 },
  { key: 'uttar-pradesh', label: 'Uttar Pradesh', sortOrder: 29 },
  { key: 'uttarakhand', label: 'Uttarakhand', sortOrder: 30 },
  { key: 'west-bengal', label: 'West Bengal', sortOrder: 31 },
  { key: 'andaman-and-nicobar', label: 'Andaman and Nicobar Islands', sortOrder: 32 },
  { key: 'chandigarh', label: 'Chandigarh', sortOrder: 33 },
  { key: 'dadra-nagar-haveli-daman-diu', label: 'Dadra and Nagar Haveli and Daman and Diu', sortOrder: 34 },
  { key: 'lakshadweep', label: 'Lakshadweep', sortOrder: 35 },
  { key: 'puducherry', label: 'Puducherry', sortOrder: 36 },
];

// Comprehensive district coverage for ALL 36 States and Union Territories
const DISTRICTS_BY_STATE = {
  // Northern & Central States
  'uttar-pradesh': ['Lucknow', 'Kanpur Nagar', 'Varanasi', 'Prayagraj', 'Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Agra', 'Meerut', 'Gorakhpur', 'Bareilly', 'Aligarh', 'Moradabad'],
  'delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North West Delhi', 'South West Delhi'],
  'bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Nalanda', 'Begusarai'],
  'madhya-pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  'rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara'],
  'haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Rohtak'],
  'punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'SAS Nagar (Mohali)'],
  'himachal-pradesh': ['Shimla', 'Kangra (Dharamshala)', 'Mandi', 'Solan', 'Kullu', 'Hamirpur'],
  'uttarakhand': ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar'],
  'jammu-and-kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur'],
  'ladakh': ['Leh', 'Kargil'],
  'chandigarh': ['Chandigarh'],

  // Western & Southern States
  'maharashtra': ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad (Chhatrapati Sambhajinagar)', 'Solapur'],
  'gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'goa': ['North Goa (Panaji)', 'South Goa (Margao)'],
  'karnataka': ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi'],
  'tamil-nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'telangana': ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Warangal'],
  'andhra-pradesh': ['Visakhapatnam', 'Vijayawada (NTR)', 'Guntur', 'Tirupati'],
  'kerala': ['Thiruvananthapuram', 'Ernakulam (Kochi)', 'Kozhikode', 'Thrissur'],

  // Eastern & North-Eastern States
  'west-bengal': ['Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Hooghly', 'Darjeeling'],
  'jharkhand': ['Ranchi', 'Jamshedpur (East Singhbhum)', 'Dhanbad', 'Bokaro'],
  'odisha': ['Khordha (Bhubaneswar)', 'Cuttack', 'Sundargarh (Rourkela)', 'Sambalpur'],
  'chhattisgarh': ['Raipur', 'Durg', 'Bilaspur'],
  'assam': ['Kamrup Metropolitan (Guwahati)', 'Dibrugarh', 'Silchar (Cachar)', 'Jorhat'],
  'arunachal-pradesh': ['Papum Pare (Itanagar)', 'East Siang (Pasighat)', 'Tawang'],
  'manipur': ['Imphal West', 'Imphal East', 'Churachandpur'],
  'meghalaya': ['East Khasi Hills (Shillong)', 'West Garo Hills (Tura)'],
  'mizoram': ['Aizawl', 'Lunglei'],
  'nagaland': ['Kohima', 'Dimapur'],
  'sikkim': ['Gangtok', 'Namchi'],
  'tripura': ['West Tripura (Agartala)', 'Gomati (Udaipur)'],

  // Union Territories
  'andaman-and-nicobar': ['South Andaman (Port Blair)', 'North and Middle Andaman', 'Nicobar'],
  'dadra-nagar-haveli-daman-diu': ['Daman', 'Diu', 'Dadra and Nagar Haveli (Silvassa)'],
  'lakshadweep': ['Kavaratti', 'Agatti'],
  'puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
};

const INSTITUTION_TYPES = [
  { key: 'central-university', label: 'Central University', sortOrder: 1 },
  { key: 'state-university', label: 'State University', sortOrder: 2 },
  { key: 'deemed-university', label: 'Deemed to be University', sortOrder: 3 },
  { key: 'private-university', label: 'Private University', sortOrder: 4 },
  { key: 'autonomous-college', label: 'Autonomous College', sortOrder: 5 },
  { key: 'affiliated-college', label: 'Affiliated College / Institute', sortOrder: 6 },
  { key: 'coaching-institute', label: 'Coaching Institute / Academy', sortOrder: 7 },
  { key: 'polytechnic-institute', label: 'Polytechnic / ITI Institute', sortOrder: 8 },
];

const QUALIFICATIONS = [
  { key: 'qual-10th', label: '10th Standard / Matriculation', sortOrder: 1 },
  { key: 'qual-12th', label: '12th Standard / Senior Secondary', sortOrder: 2 },
  { key: 'qual-diploma', label: 'Diploma / Polytechnic', sortOrder: 3 },
  { key: 'qual-graduate', label: "Bachelor's Degree (Graduate)", sortOrder: 4 },
  { key: 'qual-post-graduate', label: "Master's Degree (Post Graduate)", sortOrder: 5 },
  { key: 'qual-bed', label: 'B.Ed / M.Ed', sortOrder: 6 },
  { key: 'qual-phd', label: 'Ph.D / Doctorate', sortOrder: 7 },
];

const DESIGNATIONS = [
  { key: 'desig-director', label: 'Director / Managing Director', sortOrder: 1 },
  { key: 'desig-principal', label: 'Principal / Dean', sortOrder: 2 },
  { key: 'desig-professor', label: 'Professor', sortOrder: 3 },
  { key: 'desig-associate-prof', label: 'Associate Professor', sortOrder: 4 },
  { key: 'desig-assistant-prof', label: 'Assistant Professor', sortOrder: 5 },
  { key: 'desig-senior-faculty', label: 'Senior Faculty / Lecturer', sortOrder: 6 },
  { key: 'desig-subject-expert', label: 'Subject Matter Expert', sortOrder: 7 },
  { key: 'desig-academic-coord', label: 'Academic Coordinator', sortOrder: 8 },
];

const EXPERIENCES = [
  { key: 'exp-fresher', label: 'Fresher (0-1 yrs)', sortOrder: 1 },
  { key: 'exp-1-3', label: '1-3 years', sortOrder: 2 },
  { key: 'exp-3-5', label: '3-5 years', sortOrder: 3 },
  { key: 'exp-5-10', label: '5-10 years', sortOrder: 4 },
  { key: 'exp-10-plus', label: '10+ years', sortOrder: 5 },
];

async function seed() {
  const config = loadConfig();
  const logger = createLogger({ level: 'error' });
  const database = createDatabase(config.mongo, logger);
  await database.connect();

  const { Taxonomy } = createInstitutionModels(database.connection);

  console.log('Seeding master educational taxonomies and dropdowns (strictly insert-only)...');

  let insertedCount = 0;
  let skippedCount = 0;

  // Insert-only helper: only sets fields on insert, never modifies existing records
  async function insertOnly(kind, key, label, sortOrder = 0, parentIds = []) {
    const res = await Taxonomy.updateOne(
      { kind, key },
      {
        $setOnInsert: {
          kind,
          key,
          label,
          sortOrder,
          status: 'active',
          parentIds,
          revision: 1,
          deletedAt: null,
        }
      },
      { upsert: true }
    );
    if (res.upsertedCount > 0) insertedCount++;
    else skippedCount++;
  }

  // 1. Boards
  for (const b of BOARDS) await insertOnly('board', b.key, b.label, b.sortOrder, []);
  const allBoards = await Taxonomy.find({ kind: 'board' });
  const allBoardIds = allBoards.map(b => b._id);

  // 2. Classes (parentIds set on insert to include all boards)
  for (const c of CLASSES) await insertOnly('class', c.key, c.label, c.sortOrder, allBoardIds);
  const allClasses = await Taxonomy.find({ kind: 'class' });
  const classMap = Object.fromEntries(allClasses.map(c => [c.key, c._id]));

  const allClassIds = allClasses.map(c => c._id);
  const schoolClassIds = ['class-6', 'class-7', 'class-8', 'class-9', 'class-10'].map(k => classMap[k]).filter(Boolean);
  const secondaryHigherIds = ['class-9', 'class-10', 'class-11', 'class-12', 'undergraduate-ug', 'postgraduate-pg'].map(k => classMap[k]).filter(Boolean);
  const seniorCollegeIds = ['class-11', 'class-12', 'undergraduate-ug', 'postgraduate-pg', 'diploma'].map(k => classMap[k]).filter(Boolean);

  // 3. Subjects (parentIds set on insert to include respective classes)
  for (const s of SUBJECTS) {
    let parents = allClassIds;
    if (s.scope === 'school_all') parents = [...schoolClassIds, classMap['class-11'], classMap['class-12']].filter(Boolean);
    else if (s.scope === 'secondary_higher') parents = secondaryHigherIds;
    else if (s.scope === 'senior_college') parents = seniorCollegeIds;
    await insertOnly('subject', s.key, s.label, s.sortOrder, parents);
  }

  // 4. Flat taxonomies
  for (const item of LANGUAGES) await insertOnly('language', item.key, item.label, item.sortOrder, []);
  for (const item of COURSE_CATEGORIES) await insertOnly('course_category', item.key, item.label, item.sortOrder, []);
  for (const item of PROGRAMS) await insertOnly('program', item.key, item.label, item.sortOrder, []);
  for (const item of INSTITUTION_TYPES) await insertOnly('institution_type', item.key, item.label, item.sortOrder, []);
  for (const item of QUALIFICATIONS) await insertOnly('qualification', item.key, item.label, item.sortOrder, []);
  for (const item of DESIGNATIONS) await insertOnly('designation', item.key, item.label, item.sortOrder, []);
  for (const item of EXPERIENCES) await insertOnly('experience', item.key, item.label, item.sortOrder, []);

  // 5. States (All 36 States & UTs)
  for (const item of STATES) await insertOnly('state', item.key, item.label, item.sortOrder, []);
  const allStates = await Taxonomy.find({ kind: 'state' });
  const stateMap = Object.fromEntries(allStates.map(s => [s.key, s._id]));

  // 6. Districts for all 36 States and UTs
  for (const [stateKey, districtNames] of Object.entries(DISTRICTS_BY_STATE)) {
    const stateId = stateMap[stateKey];
    if (!stateId) continue;
    for (let i = 0; i < districtNames.length; i++) {
      const name = districtNames[i];
      const key = `${stateKey}-${name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`.slice(0, 70);
      await insertOnly('district', key, name, i + 1, [stateId]);
    }
  }

  console.log(`\nTaxonomy seeding process finished:`);
  console.log(`- Inserted new items: ${insertedCount}`);
  console.log(`- Existing items untouched: ${skippedCount}`);

  await database.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('Taxonomy seeding failed:', err);
  process.exit(1);
});
