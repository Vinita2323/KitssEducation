// Static Mock Data for Colleges, Courses, and Applications
// Persisted in localStorage so changes made in Admin or Admission Modal persist in session.

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
  }
];

export const INITIAL_COURSES = [
  // Apex Institute
  {
    _id: "6aaa8410e0afe8274e53582d",
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

  // St. Xavier College
  {
    _id: "6aaa8410e0afe8274e535832",
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

  // Bangalore Global Business Academy
  {
    _id: "6aaa8410e0afe8274e535836",
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

  // Sunrise Law
  {
    _id: "6aaa8410e0afe8274e53583a",
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

const STORAGE_KEY = "kits_education_static_store_v2";

export function getLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.colleges) && parsed.colleges.length >= 7) {
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
