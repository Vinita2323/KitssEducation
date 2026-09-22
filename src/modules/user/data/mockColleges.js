// Static Mock Data for Colleges, Courses, and Applications
// Persisted in localStorage so changes made in Admin or Admission Modal persist in session.

export const STATE_DISTRICT_MAP = {
  "Delhi": ["New Delhi", "Central Delhi", "South Delhi", "North Delhi"],
  "Punjab": ["Kapurthala", "Ludhiana", "Jalandhar", "Amritsar"],
  "Karnataka": ["Udupi", "Bengaluru Urban", "Mysuru", "Dakshina Kannada"],
  "Uttar Pradesh": ["Gautam Buddha Nagar", "Lucknow", "Varanasi", "Kanpur Nagar"],
  "Maharashtra": ["Pune", "Mumbai City", "Nagpur", "Thane"],
  "Rajasthan": ["Jaipur", "Kota", "Jodhpur", "Udaipur"],
};

export const INITIAL_COLLEGES = [
  {
    _id: "col-delhi-univ",
    id: "col-delhi-univ",
    name: "Delhi University",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80",
    description: "Centrally funded premier collegiate university recognized globally for academic rigor, distinguished alumni, and research excellence.",
    address: "Benito Juarez Marg, South Campus & North Campus",
    city: "New Delhi",
    district: "New Delhi",
    state: "Delhi",
    country: "India",
    location: "New Delhi, Delhi",
    collegeType: "University",
    category: "University",
    verified: true,
    status: "active",
    coursesCount: 28,
    rating: 4.9,
    popularCourses: ["B.Sc Computer Science", "B.Com (Honours)", "B.A. Economics", "LL.B. Law"],
    about: "The University of Delhi is a premier university of the country with a venerable legacy and international acclaim for highest academic standards, diverse educational programmes, distinguished faculty, illustrious alumni, and modern infrastructural facilities.",
    facilities: [
      "Central Science & Humanities Libraries",
      "World-class Multi-Purpose Sports Complex",
      "High-Performance Computing Clusters",
      "Historic Heritage Campus Hostels",
      "Botanical Gardens & Research Laboratories",
      "Free Wi-Fi & Modern Smart Classrooms"
    ],
    admissionInformation: "Admissions for undergraduate programs conducted through CUET / Merit counseling quota with dedicated partner facilitation.",
    contactInformation: {
      phone: "+91 11 2700 6900",
      email: "admissions@du.ac.in",
      website: "https://du.ac.in"
    },
    createdAt: "2026-09-16T11:57:04.222Z",
    updatedAt: "2026-09-16T11:57:04.223Z"
  },
  {
    _id: "col-lpu-punjab",
    id: "col-lpu-punjab",
    name: "Lovely Professional University",
    logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80",
    description: "India's largest single-campus ultra-modern university known for global corporate placements, patent filings, and international exchange.",
    address: "Jalandhar - Delhi G.T. Road, National Highway 1",
    city: "Phagwara",
    district: "Kapurthala",
    state: "Punjab",
    country: "India",
    location: "Phagwara, Punjab",
    collegeType: "University",
    category: "University",
    verified: true,
    status: "active",
    coursesCount: 34,
    rating: 4.8,
    popularCourses: ["B.Tech CSE (AI & Cloud)", "MBA International Business", "B.Design", "B.Pharm"],
    about: "Lovely Professional University has an expansive 600+ acre campus with students from 50+ countries. Recognized for stellar placements across Fortune 500 tech giants and forward-looking multidisciplinary education.",
    facilities: [
      "Uni-Mall, Banks, Postal Service on Campus",
      "Olympic-size Swimming Pool & Indoor Stadium",
      "Google & Intel Center of Excellence",
      "Automated Residential Hostels with AC",
      "Hospital & Health Clinic 24x7",
      "Solar Powered Green Eco Campus"
    ],
    admissionInformation: "Direct admission pathways open through LPUNEST and partner scholarship reservation for 2026-2027.",
    contactInformation: {
      phone: "+91 1824 517000",
      email: "admissions@lpu.co.in",
      website: "https://lpu.in"
    },
    createdAt: "2026-09-16T11:57:04.225Z",
    updatedAt: "2026-09-16T11:57:04.225Z"
  },
  {
    _id: "col-manipal-univ",
    id: "col-manipal-univ",
    name: "Manipal University",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&auto=format&fit=crop&q=80",
    description: "Institution of Eminence deemed university acclaimed for top-ranked engineering, health sciences, management, and global research.",
    address: "Tiger Circle, Madhav Nagar, Eshwar Nagar",
    city: "Manipal",
    district: "Udupi",
    state: "Karnataka",
    country: "India",
    location: "Manipal, Karnataka",
    collegeType: "University",
    category: "University",
    verified: true,
    status: "active",
    coursesCount: 26,
    rating: 4.9,
    popularCourses: ["B.Tech Mechatronics & AI", "MBBS & Allied Health", "BBA Finance", "M.Tech Data Science"],
    about: "Manipal Academy of Higher Education (MAHE) is synonymous with academic excellence and world-class healthcare & engineering education, fostering leadership and holistic student growth.",
    facilities: [
      "Marena 6-Level Sports & Recreation Hub",
      "Kasturba Multi-Specialty Super Teaching Hospital",
      "Innovation & Innovation Commercialization Center",
      "Central Digital Anatomy Laboratory",
      "Global Cuisine Food Courts & Cafes",
      "High-Speed Campus Wireless Connectivity"
    ],
    admissionInformation: "Online entrance test and partner merit allocation currently accepting registrations for undergraduate cohorts.",
    contactInformation: {
      phone: "+91 92249 66000",
      email: "admissions@manipal.edu",
      website: "https://manipal.edu"
    },
    createdAt: "2026-09-16T11:57:04.227Z",
    updatedAt: "2026-09-16T11:57:04.227Z"
  },
  {
    _id: "6aaa8410e0afe8274e53582c",
    id: "6aaa8410e0afe8274e53582c",
    name: "Apex Institute of Technology & Management",
    logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80",
    description: "Premier NAAC 'A+' accredited partner university campus offering industry-certified engineering, AI, and management programs.",
    address: "Sector 62, Institutional Area, Knowledge Park",
    city: "Noida",
    district: "Gautam Buddha Nagar",
    state: "Uttar Pradesh",
    country: "India",
    location: "Noida, Uttar Pradesh",
    collegeType: "Institute",
    category: "Institute",
    verified: true,
    status: "active",
    coursesCount: 18,
    rating: 4.8,
    popularCourses: ["B.Tech Computer Science (AI/ML)", "BBA Digital Marketing", "MCA Enterprise Architecture"],
    about: "Apex Institute is an established center of academic excellence with state-of-the-art research laboratories, incubation centers, and partnerships with leading Fortune 500 technology firms. As an authorized KITSS Education franchise partner, students receive direct admission guidance, dual certification pathways, and 100% placement support.",
    facilities: [
      "High-Tech Computing & AI Labs",
      "Central Digital Library (50,000+ volumes)",
      "On-Campus AC Hostels & Cafeteria",
      "Innovation & Robotics Incubation Cell",
      "Olympic-size Sports Complex",
      "Wi-Fi Enabled Smart Classrooms"
    ],
    admissionInformation: "Admissions open for academic session 2026-2027. Direct admission based on 10+2 / Diploma / Bachelor marks and KITSS Partner Merit Scholarship.",
    contactInformation: {
      phone: "+91 98110 23456",
      email: "admissions@apexinstitute.edu.in",
      website: "https://apexinstitute.edu.in"
    },
    createdAt: "2026-09-16T11:57:04.222Z",
    updatedAt: "2026-09-16T11:57:04.223Z"
  },
  {
    _id: "6aaa8410e0afe8274e535831",
    id: "6aaa8410e0afe8274e535831",
    name: "St. Xavier College of Health & Allied Sciences",
    logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80",
    description: "Leading medical and healthcare sciences partner institution affiliated with multi-specialty teaching hospitals.",
    address: "Kothrud Central Campus, Paud Road",
    city: "Pune",
    district: "Pune",
    state: "Maharashtra",
    country: "India",
    location: "Pune, Maharashtra",
    collegeType: "College",
    category: "College",
    verified: true,
    status: "active",
    coursesCount: 14,
    rating: 4.8,
    popularCourses: ["Bachelor of Pharmacy (B.Pharm)", "B.Sc Nursing", "Diploma Medical Lab Technology"],
    about: "St. Xavier College of Health & Allied Sciences provides rigorous clinical and academic training. Equipped with 750-bed super specialty hospital tie-ups, students gain practical patient-care exposure right from their initial semesters.",
    facilities: [
      "Advanced Anatomy & Clinical Pathology Labs",
      "Simulation Ward & ICU Training Setup",
      "Hospital Internship Rotations",
      "Air Conditioned Seminar Halls",
      "Dedicated Girls & Boys Residential Hostels",
      "24x7 Ambulance & Medical Care"
    ],
    admissionInformation: "Provisional registration open for B.Sc Nursing, B.Pharm, and D.Pharm. Early application qualifies for institutional scholarship waiver.",
    contactInformation: {
      phone: "+91 94220 88712",
      email: "admissions@stxavierhealth.edu.in",
      website: "https://stxavierhealth.edu.in"
    },
    createdAt: "2026-09-16T11:57:04.241Z",
    updatedAt: "2026-09-16T11:57:04.241Z"
  },
  {
    _id: "6aaa8410e0afe8274e535835",
    id: "6aaa8410e0afe8274e535835",
    name: "Bangalore Global Business Academy",
    logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80",
    description: "Silicon Valley of India's top-ranked business school specializing in FinTech, E-Commerce, and Supply Chain management.",
    address: "Electronic City Phase 1, Near Infosys Gate 3",
    city: "Bangalore",
    district: "Bengaluru Urban",
    state: "Karnataka",
    country: "India",
    location: "Bangalore, Karnataka",
    collegeType: "Institute",
    category: "Institute",
    verified: true,
    status: "active",
    coursesCount: 16,
    rating: 4.7,
    popularCourses: ["BCA Cloud & Cyber Security", "B.Com Honours in Fintech", "Executive MBA in AI & Leadership"],
    about: "Bangalore Global Business Academy is located in the heart of Electronic City. Offering corporate immersive programs with industry CXOs, startup accelerators, and international exchange modules.",
    facilities: [
      "Bloomberg Financial Trading Terminal",
      "Executive Boardroom Simulation Labs",
      "Startup Seed Funding & Incubation Hub",
      "Auditorium with 1200 Seating Capacity",
      "Cafes & Multi-Cuisine Food Court",
      "Green Sustainable Eco Campus"
    ],
    admissionInformation: "Applications invited for BCA, BBA & PGDM. Group Discussion and Personal Interview rounds conducted on rolling basis.",
    contactInformation: {
      phone: "+91 80 4122 9900",
      email: "enquire@bgba.edu.in",
      website: "https://bgba.edu.in"
    },
    createdAt: "2026-09-16T11:57:04.251Z",
    updatedAt: "2026-09-16T11:57:04.251Z"
  },
  {
    _id: "6aaa8410e0afe8274e535839",
    id: "6aaa8410e0afe8274e535839",
    name: "Sunrise National Law & Arts College",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    description: "BCI-recognized premier legal academy with active moot courts, constitutional law chambers, and legal aid clinics.",
    address: "Civil Lines, Near High Court Junction",
    city: "Jaipur",
    district: "Jaipur",
    state: "Rajasthan",
    country: "India",
    location: "Jaipur, Rajasthan",
    collegeType: "College",
    category: "College",
    verified: true,
    status: "active",
    coursesCount: 12,
    rating: 4.8,
    popularCourses: ["B.A. LL.B. (Honours) 5-Year", "Bachelor of Laws (LL.B.) 3-Year", "LL.M. Constitutional Law"],
    about: "Sunrise National Law & Arts College provides holistic legal education under the guidance of retired high court judges and senior Supreme Court advocates.",
    facilities: [
      "Full Scale Replica Moot Court Room",
      "Supreme Court Case Law Digital Archives",
      "Free Legal Aid & Public Interest Center",
      "Debating Society & Cultural Amphitheater",
      "Separate Hostels with High-Speed Internet",
      "Gymnasium & Yoga Wellness Center"
    ],
    admissionInformation: "Direct admission for 5-Year Integrated BA LLB and 3-Year LLB programs through KITSS partner counseling quota.",
    contactInformation: {
      phone: "+91 141 278 4500",
      email: "admissions@sunriselaw.edu.in",
      website: "https://sunriselaw.edu.in"
    },
    createdAt: "2026-09-16T11:57:04.260Z",
    updatedAt: "2026-09-16T11:57:04.260Z"
  },
  {
    _id: "col-delhi-public-school",
    id: "col-delhi-public-school",
    name: "Delhi Public Heritage School",
    logo: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80",
    description: "Centrally affiliated exemplary senior secondary school renowned for holistic pedagogy, STEM innovation, and sports leadership.",
    address: "Mathura Road Campus, Near Central Metro",
    city: "New Delhi",
    district: "Central Delhi",
    state: "Delhi",
    country: "India",
    location: "New Delhi, Delhi",
    collegeType: "School",
    category: "School",
    verified: true,
    status: "active",
    coursesCount: 8,
    rating: 4.9,
    popularCourses: ["Senior Secondary Science (PCM/PCB)", "Commerce with Informatics", "Humanities with Fine Arts"],
    about: "Delhi Public Heritage School fosters critical thinking, intellectual curiosity, and moral integrity through experiential education, robotics labs, and comprehensive sports training.",
    facilities: [
      "Atal Tinkering STEM & Robotics Laboratory",
      "Olympic Regulation All-Weather Athletics Track",
      "Interactive Digital Smart Classrooms",
      "Junior & Senior Air-Conditioned Libraries",
      "Fine Arts, Music & Performing Theatre Hall",
      "Eco-Friendly Solar & Green Campus"
    ],
    admissionInformation: "Provisional registration for Class 9 and Class 11 streaming sessions now open through KITSS partner priority desk.",
    contactInformation: {
      phone: "+91 11 4355 2200",
      email: "admissions@dphsdelhi.edu.in",
      website: "https://dphsdelhi.edu.in"
    },
    createdAt: "2026-09-16T11:57:04.265Z",
    updatedAt: "2026-09-16T11:57:04.265Z"
  },
  {
    _id: "col-lucknow-medical",
    id: "col-lucknow-medical",
    name: "Avadh Institute of Medical & Allied Health Sciences",
    logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80",
    description: "State-of-the-art medical and paramedical institute affiliated with super-specialty teaching hospital.",
    address: "Shaheed Path, Gomti Nagar Extension",
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    location: "Lucknow, Uttar Pradesh",
    collegeType: "College",
    category: "College",
    verified: true,
    status: "active",
    coursesCount: 16,
    rating: 4.8,
    popularCourses: ["B.Sc Nursing", "B.Pharm (Pharmacy)", "Bachelor of Physiotherapy (BPT)"],
    about: "Avadh Institute of Medical Sciences offers comprehensive clinical hands-on education with 600-bed hospital rotations and certified accreditation.",
    facilities: ["Clinical Simulation Laboratory", "Super-Specialty Hospital Ward", "Central Medical Library", "Hostel & Canteen"],
    admissionInformation: "Counseling and direct admission quota open for 2026-2027.",
    contactInformation: { phone: "+91 522 239 8800", email: "admissions@avadhaims.edu.in", website: "https://avadhaims.edu.in" },
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "col-mumbai-metro",
    id: "col-mumbai-metro",
    name: "Mumbai Metropolitan Institute of Technology & AI",
    logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80",
    description: "Premier AI and software engineering campus located in Mumbai financial district with top MNC tie-ups.",
    address: "Bandra Kurla Complex (BKC), Institutional Zone",
    city: "Mumbai",
    district: "Mumbai City",
    state: "Maharashtra",
    country: "India",
    location: "Mumbai, Maharashtra",
    collegeType: "Institute",
    category: "Institute",
    verified: true,
    status: "active",
    coursesCount: 20,
    rating: 4.9,
    popularCourses: ["B.Tech Artificial Intelligence", "BCA Cloud Computing", "B.Sc Data Analytics"],
    about: "Mumbai Metropolitan Institute is an innovation-first institution preparing students for high-impact careers in generative AI and cloud infrastructure.",
    facilities: ["NVIDIA GPU Compute Center", "Fintech Sandbox Lab", "Modern Smart Auditoriums", "Student Cafes"],
    admissionInformation: "Applications invited for tech and data cohorts.",
    contactInformation: { phone: "+91 22 6123 4500", email: "admissions@mumbaimetro.edu.in", website: "https://mumbaimetro.edu.in" },
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "col-ludhiana-eng",
    id: "col-ludhiana-eng",
    name: "Punjab Institute of Engineering & Robotics",
    logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    description: "Leading northern technological institute recognized for mechatronics, industrial automation, and patent research.",
    address: "Ferozepur Road, Near Aggar Nagar",
    city: "Ludhiana",
    district: "Ludhiana",
    state: "Punjab",
    country: "India",
    location: "Ludhiana, Punjab",
    collegeType: "College",
    category: "College",
    verified: true,
    status: "active",
    coursesCount: 15,
    rating: 4.7,
    popularCourses: ["B.Tech Mechanical & Mechatronics", "B.Tech Electrical Engineering", "Diploma in Industrial Robotics"],
    about: "Punjab Institute of Engineering & Robotics provides hands-on industry apprenticeships and robotics labs for engineering excellence.",
    facilities: ["Robotics Automation Foundry", "CNC & Heavy Machining Workshop", "Cad/Cam Lab", "Sports Arena"],
    admissionInformation: "JEE Main / State merit counseling admissions open.",
    contactInformation: { phone: "+91 161 240 5500", email: "admissions@pier.edu.in", website: "https://pier.edu.in" },
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "col-kota-tech",
    id: "col-kota-tech",
    name: "Kota National Institute of Science & Technology",
    logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80",
    description: "Renowned education center located in India's coaching capital, specializing in applied sciences and engineering.",
    address: "Jhalawar Road, Electronic Complex",
    city: "Kota",
    district: "Kota",
    state: "Rajasthan",
    country: "India",
    location: "Kota, Rajasthan",
    collegeType: "Institute",
    category: "Institute",
    verified: true,
    status: "active",
    coursesCount: 14,
    rating: 4.8,
    popularCourses: ["B.Tech Computer Science", "B.Sc Physics Honours", "M.Sc Applied Mathematics"],
    about: "Kota National Institute combines rigorous conceptual foundation with tech-forward engineering research.",
    facilities: ["Advanced Physics & Optics Labs", "Modern Digital Classroom Pods", "Hostel & Dining Complex"],
    admissionInformation: "Direct admissions and merit scholarship admissions open for 2026.",
    contactInformation: { phone: "+91 744 248 9900", email: "info@kotanist.edu.in", website: "https://kotanist.edu.in" },
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  }
];

export const INITIAL_COURSES = [
  // 1. Delhi University (col-delhi-univ)
  {
    _id: "crs-du-cs",
    id: "crs-du-cs",
    courseName: "B.Sc (Honours) Computer Science",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with Mathematics (Minimum 60% aggregate)",
    fee: 48000,
    description: "Rigorous computing science curriculum covering Algorithms, Data Structures, Machine Learning, and Software Engineering.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-delhi-univ",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "crs-du-bcom",
    id: "crs-du-bcom",
    courseName: "Bachelor of Commerce - B.Com (Honours)",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with Mathematics or Accountancy (Minimum 55%)",
    fee: 42000,
    description: "Premier commerce program with focus on Financial Markets, Corporate Taxation, Investment Banking, and Business Law.",
    availableSeats: 180,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-delhi-univ",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "crs-du-eco",
    id: "crs-du-eco",
    courseName: "B.A. (Honours) Economics & Data Science",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 in any stream with Mathematics (Minimum 60%)",
    fee: 38000,
    description: "Interdisciplinary economics, econometrics, statistical modeling, public policy analysis, and macro-economics.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-delhi-univ",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },

  // 2. Lovely Professional University (col-lpu-punjab)
  {
    _id: "crs-lpu-cse",
    id: "crs-lpu-cse",
    courseName: "B.Tech Computer Science (AI & Cloud Engineering)",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Mathematics & English (Min 60%)",
    fee: 160000,
    description: "Industry-certified tech program in collaboration with Google Cloud & Microsoft Azure with full-stack capstone labs.",
    availableSeats: 240,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-lpu-punjab",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "crs-lpu-mba",
    id: "crs-lpu-mba",
    courseName: "MBA in International Business & Corporate Strategy",
    degreeType: "Postgraduate",
    duration: "2 Years",
    eligibility: "Bachelor's degree in any discipline with minimum 50% marks",
    fee: 190000,
    description: "Global business curriculum featuring international study tours, live corporate consultancy, and multi-market trade simulations.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-lpu-punjab",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "crs-lpu-bdes",
    id: "crs-lpu-bdes",
    courseName: "Bachelor of Design (B.Des - User Experience & Interactive Media)",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 in any discipline with creative aptitude",
    fee: 140000,
    description: "Comprehensive product design, UI/UX design research, AR/VR spatial interfaces, and design studio apprenticeships.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-lpu-punjab",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },

  // 3. Manipal University (col-manipal-univ)
  {
    _id: "crs-manipal-mecha",
    id: "crs-manipal-mecha",
    courseName: "B.Tech Mechatronics & Autonomous Systems",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Mathematics & Chemistry (Min 60%)",
    fee: 175000,
    description: "Advanced multidisciplinary engineering integrating robotics, micro-controllers, IoT sensors, and autonomous vehicles.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-manipal-univ",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "crs-manipal-bba",
    id: "crs-manipal-bba",
    courseName: "Bachelor of Business Administration (BBA - Global Finance)",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 in any stream with minimum 50% aggregate",
    fee: 120000,
    description: "International corporate finance, investment valuation, portfolio management, and global financial market modeling.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-manipal-univ",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "crs-manipal-mtech",
    id: "crs-manipal-mtech",
    courseName: "M.Tech Data Science & Artificial Intelligence",
    degreeType: "Postgraduate",
    duration: "2 Years",
    eligibility: "B.Tech / B.E. in relevant discipline with 55% aggregate",
    fee: 155000,
    description: "Postgraduate research program in Natural Language Processing, Computer Vision, Deep Learning, and Distributed Computing.",
    availableSeats: 45,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-manipal-univ",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },

  // 4. Apex Institute of Technology & Management (6aaa8410e0afe8274e53582c)
  {
    _id: "6aaa8410e0afe8274e53582d",
    id: "6aaa8410e0afe8274e53582d",
    courseName: "B.Tech Computer Science & Engineering (AI & ML)",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Mathematics & Chemistry (Min 60%)",
    fee: 145000,
    description: "Hands-on engineering curriculum with specialization in Machine Learning, Deep Learning, Cloud Computing, and Big Data Analytics.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e53582c",
    createdAt: "2026-09-16T11:57:04.228Z",
    updatedAt: "2026-09-16T11:57:04.228Z"
  },
  {
    _id: "6aaa8410e0afe8274e53582e",
    id: "6aaa8410e0afe8274e53582e",
    courseName: "Bachelor of Business Administration (BBA - Digital Marketing)",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 in any stream with minimum 50% aggregate",
    fee: 95000,
    description: "Modern management degree emphasizing data-driven growth, fintech basics, global supply chain, and digital business strategies.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e53582c",
    createdAt: "2026-09-16T11:57:04.231Z",
    updatedAt: "2026-09-16T11:57:04.231Z"
  },
  {
    _id: "6aaa8410e0afe8274e53582f",
    id: "6aaa8410e0afe8274e53582f",
    courseName: "Master of Computer Applications (MCA)",
    degreeType: "Postgraduate",
    duration: "2 Years",
    eligibility: "BCA / B.Sc Computer Science / B.Tech with 50% marks",
    fee: 110000,
    description: "Advanced full-stack enterprise architecture, DevOps, cybersecurity, and cloud migration frameworks.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e53582c",
    createdAt: "2026-09-16T11:57:04.234Z",
    updatedAt: "2026-09-16T11:57:04.234Z"
  },

  // 5. St. Xavier College of Health & Allied Sciences (6aaa8410e0afe8274e535831)
  {
    _id: "6aaa8410e0afe8274e535832",
    id: "6aaa8410e0afe8274e535832",
    courseName: "Bachelor of Pharmacy (B.Pharm)",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with PCB / PCM with minimum 50% aggregate",
    fee: 115000,
    description: "PCI-approved program covering pharmacology, medicinal chemistry, pharmaceutical formulation, and drug regulations.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535831",
    createdAt: "2026-09-16T11:57:04.244Z",
    updatedAt: "2026-09-16T11:57:04.244Z"
  },
  {
    _id: "6aaa8410e0afe8274e535833",
    id: "6aaa8410e0afe8274e535833",
    courseName: "B.Sc Nursing",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with PCB (Physics, Chemistry, Biology) & English",
    fee: 105000,
    description: "INC-recognized nursing degree offering extensive patient care experience across pediatric, surgical, and intensive care units.",
    availableSeats: 80,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535831",
    createdAt: "2026-09-16T11:57:04.247Z",
    updatedAt: "2026-09-16T11:57:04.247Z"
  },
  {
    _id: "crs-stx-dmlt",
    id: "crs-stx-dmlt",
    courseName: "Diploma in Medical Laboratory Technology (DMLT)",
    degreeType: "Diploma",
    duration: "2 Years",
    eligibility: "10+2 in Science stream with minimum 45% marks",
    fee: 65000,
    description: "Hands-on clinical diagnostic training in hematology, pathology, clinical microbiology, and diagnostic equipment.",
    availableSeats: 40,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535831",
    createdAt: "2026-09-16T11:57:04.247Z",
    updatedAt: "2026-09-16T11:57:04.247Z"
  },

  // 6. Bangalore Global Business Academy (6aaa8410e0afe8274e535835)
  {
    _id: "6aaa8410e0afe8274e535836",
    id: "6aaa8410e0afe8274e535836",
    courseName: "Bachelor of Computer Applications (BCA - Cloud & Cyber)",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with Mathematics/Computer Science or equivalent",
    fee: 88000,
    description: "Industry aligned curriculum covering Fullstack Web Development, AWS/Azure Cloud Foundations, and Information Security.",
    availableSeats: 100,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535835",
    createdAt: "2026-09-16T11:57:04.253Z",
    updatedAt: "2026-09-16T11:57:04.253Z"
  },
  {
    _id: "crs-bgba-bcom",
    id: "crs-bgba-bcom",
    courseName: "B.Com Honours in FinTech & Digital Banking",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with Commerce or Mathematics (Minimum 50%)",
    fee: 95000,
    description: "Digital payment architectures, blockchain in banking, algorithmic trading, and modern venture financial modeling.",
    availableSeats: 80,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535835",
    createdAt: "2026-09-16T11:57:04.253Z",
    updatedAt: "2026-09-16T11:57:04.253Z"
  },
  {
    _id: "crs-bgba-mba",
    id: "crs-bgba-mba",
    courseName: "Executive MBA in AI & Technology Strategy",
    degreeType: "Postgraduate",
    duration: "2 Years",
    eligibility: "Graduation with 50% aggregate + corporate work experience",
    fee: 180000,
    description: "Advanced leadership development covering Generative AI in business, enterprise agility, M&A strategy, and corporate incubation.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535835",
    createdAt: "2026-09-16T11:57:04.253Z",
    updatedAt: "2026-09-16T11:57:04.253Z"
  },

  // 7. Sunrise National Law & Arts College (6aaa8410e0afe8274e535839)
  {
    _id: "6aaa8410e0afe8274e53583a",
    id: "6aaa8410e0afe8274e53583a",
    courseName: "B.A. LL.B. (Honours) 5-Year Integrated",
    degreeType: "Undergraduate",
    duration: "5 Years",
    eligibility: "10+2 in any discipline with minimum 45% aggregate",
    fee: 110000,
    description: "Comprehensive 5-year dual degree integrating political science, sociology, criminal jurisprudence, and corporate law.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535839",
    createdAt: "2026-09-16T11:57:04.262Z",
    updatedAt: "2026-09-16T11:57:04.262Z"
  },
  {
    _id: "crs-sun-llb",
    id: "crs-sun-llb",
    courseName: "Bachelor of Laws (LL.B.) 3-Year Professional",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "Graduation in any discipline with minimum 45% marks",
    fee: 85000,
    description: "BCI-recognized 3-year law degree focusing on civil advocacy, constitutional litigation, arbitration, and court practice.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535839",
    createdAt: "2026-09-16T11:57:04.262Z",
    updatedAt: "2026-09-16T11:57:04.262Z"
  },
  {
    _id: "crs-sun-llm",
    id: "crs-sun-llm",
    courseName: "Master of Laws (LL.M.) in Corporate & Cyber Law",
    degreeType: "Postgraduate",
    duration: "1 Year",
    eligibility: "LL.B. degree from recognized university with 50% marks",
    fee: 95000,
    description: "Specialized Master's program in international dispute resolution, data privacy regulations, and cross-border commercial contracts.",
    availableSeats: 40,
    admissionStatus: "Open",
    status: "active",
    collegeId: "6aaa8410e0afe8274e535839",
    createdAt: "2026-09-16T11:57:04.262Z",
    updatedAt: "2026-09-16T11:57:04.262Z"
  },

  // 8. Delhi Public Heritage School (col-delhi-public-school)
  {
    _id: "crs-dphs-sci",
    id: "crs-dphs-sci",
    courseName: "Senior Secondary Science (PCM / PCB with AI Elective)",
    degreeType: "Senior Secondary",
    duration: "2 Years",
    eligibility: "Class 10 Board exam passed with minimum 65% aggregate",
    fee: 75000,
    description: "Comprehensive CBSE-affiliated curriculum with advanced laboratories, Olympiad mentorship, and JEE/NEET foundational coaching.",
    availableSeats: 100,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-delhi-public-school",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-dphs-comm",
    id: "crs-dphs-comm",
    courseName: "Senior Secondary Commerce with Informatics Practices",
    degreeType: "Senior Secondary",
    duration: "2 Years",
    eligibility: "Class 10 Board exam passed with minimum 55% marks",
    fee: 65000,
    description: "Rigorous commerce education incorporating financial accountancy, economics, entrepreneurship, and Python programming.",
    availableSeats: 80,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-delhi-public-school",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-dphs-arts",
    id: "crs-dphs-arts",
    courseName: "Senior Secondary Humanities & Liberal Arts",
    degreeType: "Senior Secondary",
    duration: "2 Years",
    eligibility: "Class 10 Board exam passed with minimum 50% marks",
    fee: 60000,
    description: "Multidisciplinary social sciences, political science, history, psychology, and public policy foundational studies.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-delhi-public-school",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },

  // 9. Avadh Institute of Medical & Allied Health Sciences (col-lucknow-medical)
  {
    _id: "crs-avadh-nursing",
    id: "crs-avadh-nursing",
    courseName: "Bachelor of Science in Nursing (B.Sc Nursing)",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Chemistry, Biology & English (Min 50%)",
    fee: 110000,
    description: "Extensive clinical bed-side training in 600-bed hospital covering emergency care, surgical ICU, and pediatric healthcare.",
    availableSeats: 80,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-lucknow-medical",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-avadh-pharm",
    id: "crs-avadh-pharm",
    courseName: "Bachelor of Pharmacy (B.Pharm)",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with PCB or PCM with minimum 50% aggregate",
    fee: 115000,
    description: "Pharmacy Council approved curriculum covering therapeutic pharmacology, biopharmaceutics, and clinical trials.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-lucknow-medical",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-avadh-bpt",
    id: "crs-avadh-bpt",
    courseName: "Bachelor of Physiotherapy (BPT)",
    degreeType: "Undergraduate",
    duration: "4.5 Years",
    eligibility: "10+2 in Science stream with Biology (Minimum 50%)",
    fee: 98000,
    description: "Orthopedic, neurological, and sports rehabilitation with dedicated clinical rotations and outpatient therapy centers.",
    availableSeats: 50,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-lucknow-medical",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },

  // 10. Mumbai Metropolitan Institute of Technology & AI (col-mumbai-metro)
  {
    _id: "crs-mumbai-ai",
    id: "crs-mumbai-ai",
    courseName: "B.Tech Artificial Intelligence & Machine Learning",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Mathematics & Chemistry (Min 60%)",
    fee: 155000,
    description: "Full-stack AI curriculum with NVIDIA GPU accelerated compute labs, deep neural networks, and generative AI capstones.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-mumbai-metro",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-mumbai-bca",
    id: "crs-mumbai-bca",
    courseName: "Bachelor of Computer Applications (BCA Cloud & DevOps)",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with Mathematics/Computer Science (Min 50%)",
    fee: 92000,
    description: "Industry-aligned software engineering focusing on Kubernetes, microservices, cloud security, and CI/CD pipelines.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-mumbai-metro",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-mumbai-data",
    id: "crs-mumbai-data",
    courseName: "B.Sc Data Analytics & Financial Engineering",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 in Science or Commerce with Mathematics (Min 55%)",
    fee: 88000,
    description: "Quantitative financial modeling, high-frequency trading basics, data warehousing, and business intelligence dashboards.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-mumbai-metro",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },

  // 11. Punjab Institute of Engineering & Robotics (col-ludhiana-eng)
  {
    _id: "crs-pier-mech",
    id: "crs-pier-mech",
    courseName: "B.Tech Mechanical Engineering with Mechatronics Specialization",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with PCM (Physics, Chemistry, Maths) Min 55%",
    fee: 125000,
    description: "Hands-on engineering in CNC automation, pneumatic systems, CAD/CAM product development, and robotic welding.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-ludhiana-eng",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-pier-elec",
    id: "crs-pier-elec",
    courseName: "B.Tech Electrical & Electronics Engineering",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with PCM (Minimum 55% aggregate)",
    fee: 120000,
    description: "Power electronics, renewable energy grids, embedded microprocessors, and smart electric vehicle power trains.",
    availableSeats: 90,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-ludhiana-eng",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-pier-dip",
    id: "crs-pier-dip",
    courseName: "Diploma in Industrial Automation & Robotics",
    degreeType: "Diploma",
    duration: "3 Years",
    eligibility: "10th Standard passed with Science & Mathematics (Min 50%)",
    fee: 55000,
    description: "Vocational technical diploma in PLC programming, industrial SCADA setups, mechanical maintenance, and sensor calibration.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-ludhiana-eng",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },

  // 12. Kota National Institute of Science & Technology (col-kota-tech)
  {
    _id: "crs-kota-cse",
    id: "crs-kota-cse",
    courseName: "B.Tech Computer Science & Systems Engineering",
    degreeType: "Undergraduate",
    duration: "4 Years",
    eligibility: "10+2 with Physics, Mathematics & Chemistry (Min 60%)",
    fee: 135000,
    description: "Advanced engineering focused on computer architecture, distributed databases, cyber systems, and competitive coding.",
    availableSeats: 120,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-kota-tech",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-kota-phy",
    id: "crs-kota-phy",
    courseName: "B.Sc (Honours) Applied Physics & Photonics",
    degreeType: "Undergraduate",
    duration: "3 Years",
    eligibility: "10+2 with Physics and Mathematics (Minimum 55%)",
    fee: 68000,
    description: "Experimental optics, laser technology, semiconductor physics, quantum concepts, and modern material spectroscopy.",
    availableSeats: 60,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-kota-tech",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  },
  {
    _id: "crs-kota-math",
    id: "crs-kota-math",
    courseName: "M.Sc Applied Mathematics & Scientific Computing",
    degreeType: "Postgraduate",
    duration: "2 Years",
    eligibility: "B.Sc in Mathematics or relevant discipline (Minimum 55%)",
    fee: 72000,
    description: "Numerical analysis, differential equations, cryptographic math, high-performance scientific simulations, and data modeling.",
    availableSeats: 40,
    admissionStatus: "Open",
    status: "active",
    collegeId: "col-kota-tech",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z"
  }
];

export const INITIAL_APPLICATIONS = [
  {
    _id: "6aaa863be0afe8274e53583c",
    applicationId: "APP-2026-32951",
    studentId: "STU-2026-8891",
    collegeId: "6aaa8410e0afe8274e535839",
    courseId: "6aaa8410e0afe8274e53583a",
    studentDetails: {
      fullName: "Rohan Sharma",
      mobileNumber: "+91 98765 43210",
      email: "rohan.sharma@example.com",
      dob: "2008-08-15",
      city: "New Delhi",
      educationalQualification: "12th Standard / Intermediate",
      passingYear: "2025",
      additionalInfo: "Interested in BA LLB law quota"
    },
    status: "Contacted",
    adminNotes: [
      {
        _id: "6aaa863be0afe8274e53583d",
        note: "Spoke with student regarding scholarship eligibility. Verification scheduled.",
        author: "Chief Admissions Counselor",
        createdAt: "2026-09-16T12:06:19.723Z"
      }
    ],
    createdAt: "2026-09-16T12:06:19.710Z",
    updatedAt: "2026-09-16T12:06:19.723Z"
  }
];

const STORAGE_KEY = "kits_education_static_store_v3";

export function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.colleges)) {
        let needsSave = false;

        if (!Array.isArray(parsed.courses)) {
          parsed.courses = [...INITIAL_COURSES];
          needsSave = true;
        }

        // Add any newly added colleges from INITIAL_COLLEGES if not present
        INITIAL_COLLEGES.forEach((initCol) => {
          const exists = parsed.colleges.some(
            (c) => String(c._id || c.id) === String(initCol._id || initCol.id)
          );
          if (!exists) {
            parsed.colleges.push(initCol);
            needsSave = true;
          }
        });

        // Ensure every course from INITIAL_COURSES is in parsed.courses
        INITIAL_COURSES.forEach((initCrs) => {
          const exists = parsed.courses.some(
            (c) => String(c._id || c.id) === String(initCrs._id || initCrs.id)
          );
          if (!exists) {
            parsed.courses.push(initCrs);
            needsSave = true;
          }
        });

        // Ensure every college has a district
        parsed.colleges.forEach((c) => {
          if (!c.district) {
            const match = INITIAL_COLLEGES.find(
              (init) => String(init.id || init._id) === String(c.id || c._id)
            );
            c.district = match?.district || c.city || c.state || "Central";
            needsSave = true;
          }
        });

        if (needsSave) {
          saveLocalStore(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load from localStorage, using defaults", e);
  }

  const initial = {
    colleges: INITIAL_COLLEGES,
    courses: INITIAL_COURSES,
    applications: INITIAL_APPLICATIONS,
  };
  saveLocalStore(initial);
  return initial;
}

export function saveLocalStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save to localStorage", e);
  }
}
