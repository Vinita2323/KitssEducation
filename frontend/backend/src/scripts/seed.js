import { dataService } from "../services/dataService.js";
import { readFileStore, writeFileStore } from "../config/db.js";

export const seedInitialData = async () => {
  const existingColleges = await dataService.getColleges();
  if (existingColleges && existingColleges.length > 0) {
    console.log(`[Seed] Database already contains ${existingColleges.length} partner colleges. Skipping seed.`);
    return;
  }

  console.log("[Seed] Seeding initial partner colleges and courses...");

  const rawColleges = [
    {
      name: "Apex Institute of Technology & Management",
      logo: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=160&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
      description: "Premier NAAC 'A+' accredited partner university campus offering industry-certified engineering, AI, and management programs.",
      address: "Sector 62, Institutional Area, Knowledge Park",
      city: "Noida",
      state: "Uttar Pradesh",
      country: "India",
      location: "Noida, Uttar Pradesh",
      collegeType: "Private University",
      status: "active",
      about: "Apex Institute is an established center of academic excellence with state-of-the-art research laboratories, incubation centers, and partnerships with leading Fortune 500 technology firms. As an authorized KITSS Education franchise partner, students receive direct admission guidance, dual certification pathways, and 100% placement support.",
      facilities: [
        "High-Tech Computing & AI Labs",
        "Central Digital Library (50,000+ volumes)",
        "On-Campus AC Hostels & Cafeteria",
        "Innovation & Robotics Incubation Cell",
        "Olympic-size Sports Complex",
        "Wi-Fi Enabled Smart Classrooms",
      ],
      admissionInformation: "Admissions open for academic session 2026-2027. Direct admission based on 10+2 / Diploma / Bachelor marks and KITSS Partner Merit Scholarship.",
      contactInformation: {
        phone: "+91 98110 23456",
        email: "admissions@apexinstitute.edu.in",
        website: "https://apexinstitute.edu.in",
      },
      courses: [
        {
          courseName: "B.Tech Computer Science & Engineering (AI & ML)",
          degreeType: "Undergraduate",
          duration: "4 Years",
          eligibility: "10+2 with Physics, Mathematics & Chemistry (Min 60%)",
          fee: 145000,
          description: "Hands-on engineering curriculum with specialization in Machine Learning, Deep Learning, Cloud Computing, and Big Data Analytics.",
          availableSeats: 120,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "Bachelor of Business Administration (BBA - Digital Marketing)",
          degreeType: "Undergraduate",
          duration: "3 Years",
          eligibility: "10+2 in any stream with minimum 50% aggregate",
          fee: 95000,
          description: "Modern management degree emphasizing data-driven growth, fintech basics, global supply chain, and digital business strategies.",
          availableSeats: 90,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "Master of Computer Applications (MCA)",
          degreeType: "Postgraduate",
          duration: "2 Years",
          eligibility: "BCA / B.Sc Computer Science / B.Tech with 50% marks",
          fee: 110000,
          description: "Advanced full-stack enterprise architecture, DevOps, cybersecurity, and cloud migration frameworks.",
          availableSeats: 60,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "MBA in Business Analytics & Strategy",
          degreeType: "Postgraduate",
          duration: "2 Years",
          eligibility: "Graduation with minimum 50% from recognized university",
          fee: 185000,
          description: "Dual specialization MBA program with live corporate internships, case study methodology, and senior leadership mentorship.",
          availableSeats: 75,
          admissionStatus: "Open",
          status: "active",
        },
      ],
    },
    {
      name: "St. Xavier College of Health & Allied Sciences",
      logo: "https://images.unsplash.com/photo-1562774053-701939374585?w=160&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&auto=format&fit=crop&q=80",
      description: "Leading medical and healthcare sciences partner institution affiliated with multi-specialty teaching hospitals.",
      address: "Kothrud Central Campus, Paud Road",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      location: "Pune, Maharashtra",
      collegeType: "Autonomous College",
      status: "active",
      about: "St. Xavier College of Health & Allied Sciences provides rigorous clinical and academic training. Equipped with 750-bed super specialty hospital tie-ups, students gain practical patient-care exposure right from their initial semesters.",
      facilities: [
        "Advanced Anatomy & Clinical Pathology Labs",
        "Simulation Ward & ICU Training Setup",
        "Hospital Internship Rotations",
        "Air Conditioned Seminar Halls",
        "Dedicated Girls & Boys Residential Hostels",
        "24x7 Ambulance & Medical Care",
      ],
      admissionInformation: "Provisional registration open for B.Sc Nursing, B.Pharm, and D.Pharm. Early application qualifies for institutional scholarship waiver.",
      contactInformation: {
        phone: "+91 94220 88712",
        email: "admissions@stxavierhealth.edu.in",
        website: "https://stxavierhealth.edu.in",
      },
      courses: [
        {
          courseName: "Bachelor of Pharmacy (B.Pharm)",
          degreeType: "Undergraduate",
          duration: "4 Years",
          eligibility: "10+2 with PCB / PCM with minimum 50% aggregate",
          fee: 115000,
          description: "PCI-approved program covering pharmacology, medicinal chemistry, pharmaceutical formulation, and drug regulations.",
          availableSeats: 60,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "B.Sc Nursing",
          degreeType: "Undergraduate",
          duration: "4 Years",
          eligibility: "10+2 with PCB (Physics, Chemistry, Biology) & English",
          fee: 105000,
          description: "INC-recognized nursing degree offering extensive patient care experience across pediatric, surgical, and intensive care units.",
          availableSeats: 80,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "Diploma in Medical Laboratory Technology (DMLT)",
          degreeType: "Diploma",
          duration: "2 Years",
          eligibility: "10+2 in Science stream with 45% marks",
          fee: 65000,
          description: "Hands-on laboratory diagnostic training in hematology, microbiology, clinical biochemistry, and histopathology.",
          availableSeats: 40,
          admissionStatus: "Open",
          status: "active",
        },
      ],
    },
    {
      name: "Bangalore Global Business Academy",
      logo: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=160&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
      description: "Silicon Valley of India's top-ranked business school specializing in FinTech, E-Commerce, and Supply Chain management.",
      address: "Electronic City Phase 1, Near Infosys Gate 3",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      location: "Bangalore, Karnataka",
      collegeType: "Deemed University",
      status: "active",
      about: "Bangalore Global Business Academy is located in the heart of Electronic City. Offering corporate immersive programs with industry CXOs, startup accelerators, and international exchange modules.",
      facilities: [
        "Bloomberg Financial Trading Terminal",
        "Executive Boardroom Simulation Labs",
        "Startup Seed Funding & Incubation Hub",
        "Auditorium with 1200 Seating Capacity",
        "Cafes & Multi-Cuisine Food Court",
        "Green Sustainable Eco Campus",
      ],
      admissionInformation: "Applications invited for BCA, BBA & PGDM. Group Discussion and Personal Interview rounds conducted on rolling basis.",
      contactInformation: {
        phone: "+91 80 4122 9900",
        email: "enquire@bgba.edu.in",
        website: "https://bgba.edu.in",
      },
      courses: [
        {
          courseName: "Bachelor of Computer Applications (BCA - Cloud & Cyber)",
          degreeType: "Undergraduate",
          duration: "3 Years",
          eligibility: "10+2 with Mathematics/Computer Science or equivalent",
          fee: 88000,
          description: "Industry aligned curriculum covering Fullstack Web Development, AWS/Azure Cloud Foundations, and Information Security.",
          availableSeats: 100,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "Bachelor of Commerce (B.Com - Honours in Fintech)",
          degreeType: "Undergraduate",
          duration: "3 Years",
          eligibility: "10+2 with Commerce or Science (Min 50%)",
          fee: 78000,
          description: "Specialized financial technology education encompassing blockchain, algorithmic trading, financial modeling, and corporate tax.",
          availableSeats: 60,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "Executive MBA in Artificial Intelligence & Leadership",
          degreeType: "Postgraduate",
          duration: "2 Years",
          eligibility: "Graduation with at least 2 years work experience",
          fee: 210000,
          description: "Tailored for aspiring tech managers and leaders looking to spearhead generative AI transformation in enterprise environments.",
          availableSeats: 50,
          admissionStatus: "Open",
          status: "active",
        },
      ],
    },
    {
      name: "Sunrise National Law & Arts Institute",
      logo: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80",
      banner: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&auto=format&fit=crop&q=80",
      description: "BCI-recognized premier legal academy with active moot courts, constitutional law chambers, and legal aid clinics.",
      address: "Civil Lines, Near High Court Junction",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      location: "Jaipur, Rajasthan",
      collegeType: "State Approved Autonomous College",
      status: "active",
      about: "Sunrise National Law & Arts Institute provides holistic legal education under the guidance of retired high court judges and senior Supreme Court advocates.",
      facilities: [
        "Full Scale Replica Moot Court Room",
        "Supreme Court Case Law Digital Archives",
        "Free Legal Aid & Public Interest Center",
        "Debating Society & Cultural Amphitheater",
        "Separate Hostels with High-Speed Internet",
        "Gymnasium & Yoga Wellness Center",
      ],
      admissionInformation: "Direct admission for 5-Year Integrated BA LLB and 3-Year LLB programs through KITSS partner counseling quota.",
      contactInformation: {
        phone: "+91 141 278 4500",
        email: "admissions@sunriselaw.edu.in",
        website: "https://sunriselaw.edu.in",
      },
      courses: [
        {
          courseName: "B.A. LL.B. (Honours) 5-Year Integrated",
          degreeType: "Undergraduate",
          duration: "5 Years",
          eligibility: "10+2 in any discipline with minimum 45% aggregate",
          fee: 110000,
          description: "Comprehensive 5-year dual degree integrating political science, sociology, criminal jurisprudence, and corporate law.",
          availableSeats: 120,
          admissionStatus: "Open",
          status: "active",
        },
        {
          courseName: "Bachelor of Laws (LL.B.) 3-Year",
          degreeType: "Undergraduate",
          duration: "3 Years",
          eligibility: "Graduation in any stream with minimum 45% aggregate",
          fee: 85000,
          description: "Intensive 3-year law degree focusing on civil procedure, criminal law, constitutional rights, and intellectual property.",
          availableSeats: 90,
          admissionStatus: "Open",
          status: "active",
        },
      ],
    },
  ];

  for (const cData of rawColleges) {
    const { courses, ...collegeOnly } = cData;
    const createdCollege = await dataService.createCollege(collegeOnly);
    const collegeId = createdCollege._id || createdCollege.id;

    if (courses && courses.length > 0) {
      for (const crs of courses) {
        await dataService.createCourse({
          ...crs,
          collegeId,
        });
      }
    }
  }

  console.log(`[Seed] Seeded ${rawColleges.length} partner colleges successfully.`);
};
