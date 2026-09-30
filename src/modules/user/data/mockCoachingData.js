// Mock Data Store for KITSS Education Online Coaching Module
// Zero backend dependency - backed by localStorage for real-time reactivity and session persistence.

export const INITIAL_COACHING_COURSES = [
  {
    id: "course-cbse-10-sci",
    title: "Class 10 CBSE Science",
    subtitle: "Complete Mastery in Physics, Chemistry & Biology with Chapter Notes",
    description: "Comprehensive foundational and board preparation program for Class 10 CBSE students. Features conceptual video lectures, digital NCERT companion notes, experiment demonstrations, and chapter-wise question banks.",
    board: "CBSE",
    class: "Class 10",
    state: "Delhi",
    courseType: "Comprehensive",
    language: "English",
    subjects: ["Physics", "Chemistry", "Biology"],
    teacher: "Dr. Alok Verma & Dr. Neha Gupta",
    teacherRole: "Senior CBSE Science Mentors (14+ Yrs Exp)",
    teacherAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    lecturesCount: 85,
    booksCount: 12,
    duration: "6 Months",
    status: "Active",
    rating: 4.9,
    reviewCount: 428,
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80",
    expiryDate: "15 March 2027",
    isEnrolled: true,
    progressPercentage: 42,
    completedLectures: 36,
    whatYouWillLearn: [
      "100% syllabus coverage for CBSE Class 10 Board examinations",
      "In-depth conceptual grasp of chemical reactions, light reflection & human organ systems",
      "Interactive diagram sketching guidelines and standard formula sheets",
      "Exam-oriented sample papers, case-based questions, and previous 10-year trends",
      "Exclusive doubt clearing mentorship and board scoring methodologies"
    ],
    benefits: [
      "Protected streaming video lectures with playback speed controls",
      "Curated digital study materials & chapter-wise PDF workbooks",
      "Personalized student progress tracking across subjects",
      "Continuous curriculum updates aligning with latest CBSE guidelines"
    ],
    subjectsData: [
      {
        subjectName: "Physics",
        icon: "Atom",
        color: "#133C8B",
        lectures: [
          {
            id: "lec-sci-phy-01",
            title: "1. Light: Reflection and Spherical Mirrors",
            duration: "18:45",
            teacher: "Dr. Alok Verma",
            isCompleted: true,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Laws of reflection, focal length calculation, and ray diagrams for concave and convex mirrors."
          },
          {
            id: "lec-sci-phy-02",
            title: "2. Refraction & Lens Formula Applications",
            duration: "21:10",
            teacher: "Dr. Alok Verma",
            isCompleted: true,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Snell's Law, refractive index calculation, lens maker formula, and power of a lens."
          },
          {
            id: "lec-sci-phy-03",
            title: "3. Human Eye and the Colorful World",
            duration: "16:20",
            teacher: "Dr. Alok Verma",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Defects of vision (myopia, hypermetropia, presbyopia), dispersion through a prism, and atmospheric refraction."
          },
          {
            id: "lec-sci-phy-04",
            title: "4. Electricity: Ohm's Law and Resistivity",
            duration: "24:30",
            teacher: "Dr. Alok Verma",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Electric current, potential difference, series and parallel circuit calculations, and Joule's heating effect."
          },
          {
            id: "lec-sci-phy-05",
            title: "5. Magnetic Effects of Electric Current (Advanced)",
            duration: "22:15",
            teacher: "Dr. Alok Verma",
            isCompleted: false,
            isLocked: true,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Right-Hand Thumb rule, Fleming's Left-Hand rule, electric motor, and electromagnetic induction principles."
          }
        ],
        books: [
          {
            id: "book-sci-phy-01",
            title: "Class 10 Physics: Complete Concept Handbook",
            subject: "Physics",
            chapter: "Chapter 1 & 2",
            pages: 48,
            currentPage: 18,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&auto=format&fit=crop&q=80",
            description: "Concise handwritten formulas, standard ray diagrams, and 50 solved numerical problems on Optics and Light."
          },
          {
            id: "book-sci-phy-02",
            title: "Electricity & Magnetism Practice Workbook",
            subject: "Physics",
            chapter: "Chapter 3 & 4",
            pages: 36,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&auto=format&fit=crop&q=80",
            description: "Circuit analysis work sheets, resistor combinations, and board examination question banks with step-by-step marking."
          }
        ]
      },
      {
        subjectName: "Chemistry",
        icon: "FlaskConical",
        color: "#FF8A00",
        lectures: [
          {
            id: "lec-sci-chem-01",
            title: "1. Chemical Reactions & Equations",
            duration: "19:50",
            teacher: "Dr. Neha Gupta",
            isCompleted: true,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Balancing chemical equations, combination, decomposition, displacement, and redox reactions with real-world examples."
          },
          {
            id: "lec-sci-chem-02",
            title: "2. Acids, Bases and Salts: pH Scale",
            duration: "23:05",
            teacher: "Dr. Neha Gupta",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Indicator reactions, universal indicator, pH scale applications, bleaching powder, and Plaster of Paris preparation."
          },
          {
            id: "lec-sci-chem-03",
            title: "3. Metals and Non-Metals: Reactivity Series",
            duration: "20:40",
            teacher: "Dr. Neha Gupta",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Physical and chemical properties, ionic compounds formation, metallurgy extraction steps, and corrosion prevention."
          },
          {
            id: "lec-sci-chem-04",
            title: "4. Carbon and its Compounds: Covalent Bonding",
            duration: "27:15",
            teacher: "Dr. Neha Gupta",
            isCompleted: false,
            isLocked: true,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Tetravalency, catenation, homologous series, functional groups, and cleansing action of soaps vs detergents."
          }
        ],
        books: [
          {
            id: "book-sci-chem-01",
            title: "Class 10 Chemistry Reactions & Equation Master",
            subject: "Chemistry",
            chapter: "Chapter 1 to 3",
            pages: 52,
            currentPage: 24,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&auto=format&fit=crop&q=80",
            description: "Table of all NCERT chemical equations, balanced ionic formulas, common salt manufacturing, and reaction colors guide."
          },
          {
            id: "book-sci-chem-02",
            title: "Carbon Compounds & Organic Chemistry Notes",
            subject: "Chemistry",
            chapter: "Chapter 4",
            pages: 40,
            currentPage: 5,
            isLocked: true,
            cover: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&auto=format&fit=crop&q=80",
            description: "Comprehensive molecular structures, isomerism illustrations, IUPAC nomenclature for 10th grade, and reaction mechanisms."
          }
        ]
      },
      {
        subjectName: "Biology",
        icon: "Dna",
        color: "#17B26A",
        lectures: [
          {
            id: "lec-sci-bio-01",
            title: "1. Life Processes: Nutrition & Cellular Respiration",
            duration: "25:10",
            teacher: "Dr. Neha Gupta",
            isCompleted: true,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Autotrophic and heterotrophic nutrition, human digestive tract mechanism, aerobic vs anaerobic respiration pathways."
          },
          {
            id: "lec-sci-bio-02",
            title: "2. Transportation & Excretion in Humans",
            duration: "22:40",
            teacher: "Dr. Neha Gupta",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Structure of the human heart, double circulation, xylem & phloem translocation, structure of nephron."
          },
          {
            id: "lec-sci-bio-03",
            title: "3. Control and Coordination: Brain & Reflex Arc",
            duration: "20:15",
            teacher: "Dr. Neha Gupta",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Neuron anatomy, reflex arc mechanism, central and peripheral nervous system, plant hormones (auxins, gibberellins)."
          },
          {
            id: "lec-sci-bio-04",
            title: "4. Heredity & Evolution (Mendel's Laws)",
            duration: "26:30",
            teacher: "Dr. Neha Gupta",
            isCompleted: false,
            isLocked: true,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Monohybrid and dihybrid cross, sex determination in humans, dominant vs recessive traits, and phenotype ratios."
          }
        ],
        books: [
          {
            id: "book-sci-bio-01",
            title: "Class 10 Biology Diagrams & Anatomy Compendium",
            subject: "Biology",
            chapter: "Life Processes",
            pages: 64,
            currentPage: 30,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=400&auto=format&fit=crop&q=80",
            description: "High-resolution labeled biological diagrams for board examinations, organ functioning summaries, and point-wise notes."
          },
          {
            id: "book-sci-bio-02",
            title: "Heredity & Genetics Illustrated Companion",
            subject: "Biology",
            chapter: "Heredity",
            pages: 28,
            currentPage: 1,
            isLocked: true,
            cover: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&auto=format&fit=crop&q=80",
            description: "Punnett square worksheets, Mendelian principles explained visually, and board question bank with answer keys."
          }
        ]
      }
    ]
  },
  {
    id: "course-cbse-12-pcm",
    title: "Class 12 CBSE Physics & Mathematics",
    subtitle: "Board Excellence & Foundation for Engineering Competitive Exams",
    description: "Targeted Class 12 board preparation combined with foundational rigor for JEE aspirants. Covers electrostatics, calculus, vectors, magnetism, and modern physics.",
    board: "CBSE",
    class: "Class 12",
    state: "Delhi",
    courseType: "Comprehensive",
    language: "English",
    subjects: ["Physics", "Mathematics"],
    teacher: "Prof. Rajesh Malhotra & Dr. S. Raman",
    teacherRole: "IIT Alumni & Senior Educationists (18+ Yrs Exp)",
    teacherAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    lecturesCount: 110,
    booksCount: 16,
    duration: "12 Months",
    status: "Active",
    rating: 4.8,
    reviewCount: 310,
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80",
    expiryDate: "30 April 2027",
    isEnrolled: false,
    progressPercentage: 0,
    completedLectures: 0,
    whatYouWillLearn: [
      "Mastery of Integral and Differential Calculus with practical applications",
      "Rigorous electrostatics, capacitance, and electromagnetic waves derivation",
      "Vector algebra, 3D geometry equations, and linear programming",
      "Semiconductor physics, logic gates, and wave optics interference patterns"
    ],
    benefits: [
      "Extensive derivations handbook and formula cheat sheets",
      "Interactive 3D geometry visualizations in video lessons",
      "Mock tests simulated per latest CBSE Class 12 blueprints"
    ],
    subjectsData: [
      {
        subjectName: "Physics",
        icon: "Atom",
        color: "#133C8B",
        lectures: [
          {
            id: "lec-12-phy-01",
            title: "1. Electric Charges & Fields: Gauss Law",
            duration: "24:10",
            teacher: "Prof. Rajesh Malhotra",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Coulomb's Law in vector form, electric field lines, electric dipole, and applications of Gauss Theorem."
          },
          {
            id: "lec-12-phy-02",
            title: "2. Electrostatic Potential & Capacitors",
            duration: "28:40",
            teacher: "Prof. Rajesh Malhotra",
            isCompleted: false,
            isLocked: true,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Equipotential surfaces, energy stored in capacitors, dielectrics, and combinations of capacitors."
          }
        ],
        books: [
          {
            id: "book-12-phy-01",
            title: "Class 12 Physics: Electromagnetism Master Notes",
            subject: "Physics",
            chapter: "Part 1 Electromagnetism",
            pages: 82,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&auto=format&fit=crop&q=80",
            description: "Stepwise derivations, conceptual numerical problems, and high-weightage board questions."
          }
        ]
      },
      {
        subjectName: "Mathematics",
        icon: "Sigma",
        color: "#0A1D3F",
        lectures: [
          {
            id: "lec-12-math-01",
            title: "1. Continuity and Differentiability",
            duration: "26:50",
            teacher: "Dr. S. Raman",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Limits review, standard derivative proofs, chain rule, implicit differentiation, and Rolle's Theorem."
          }
        ],
        books: [
          {
            id: "book-12-math-01",
            title: "Calculus & Vector Algebra Compendium",
            subject: "Mathematics",
            chapter: "Calculus",
            pages: 94,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=80",
            description: "Integral formulas, differential equations solving strategies, and 3D coordinate geometry problems."
          }
        ]
      }
    ]
  },
  {
    id: "course-mp-10-scimath",
    title: "Class 10 MP Board Science & Mathematics",
    subtitle: "Structured State Board Syllabus in Hindi & English Medium",
    description: "Tailored specifically for Madhya Pradesh Board of Secondary Education (MPBSE) students. High emphasis on blue-print question papers, objective questions (vastunishth prashna), and numerical derivations.",
    board: "Madhya Pradesh Board",
    class: "Class 10",
    state: "Madhya Pradesh",
    courseType: "Comprehensive",
    language: "Hindi",
    subjects: ["Science", "Mathematics"],
    teacher: "Er. Manoj Tiwari & Smt. Vandana Sharma",
    teacherRole: "Senior MP Board Master Teachers (15+ Yrs Exp)",
    teacherAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    lecturesCount: 90,
    booksCount: 10,
    duration: "6 Months",
    status: "Active",
    rating: 4.7,
    reviewCount: 265,
    thumbnail: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&auto=format&fit=crop&q=80",
    expiryDate: "15 March 2027",
    isEnrolled: false,
    progressPercentage: 0,
    completedLectures: 0,
    whatYouWillLearn: [
      "Complete MPBSE syllabus coverage strictly per official blueprint",
      "Chapter-wise 30 marks objective question bank with instant explanations",
      "Solved practical questions and diagrams for Science board papers",
      "Step-by-step theorem proofs and geometry constructions in Mathematics"
    ],
    benefits: [
      "Bilingual instruction (Hindi and English medium students)",
      "Model test papers designed by retired MP Board examiners",
      "Protected streaming and offline-style digital book reader"
    ],
    subjectsData: [
      {
        subjectName: "Science",
        icon: "FlaskConical",
        color: "#133C8B",
        lectures: [
          {
            id: "lec-mp10-sci-01",
            title: "1. à¤°à¤¾à¤¸à¤¾à¤¯à¤¨à¤¿à¤• à¤…à¤­à¤¿à¤•à¥à¤°à¤¿à¤¯à¤¾à¤à¤‚ à¤à¤µà¤‚ à¤¸à¤®à¥€à¤•à¤°à¤£ (Chemical Reactions)",
            duration: "21:30",
            teacher: "Er. Manoj Tiwari",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "à¤…à¤­à¤¿à¤•à¥à¤°à¤¿à¤¯à¤¾à¤“à¤‚ à¤•à¥‡ à¤ªà¥à¤°à¤•à¤¾à¤°, à¤¸à¤®à¥€à¤•à¤°à¤£ à¤¸à¤‚à¤¤à¥à¤²à¤¨ à¤•à¥€ à¤¸à¤°à¤² à¤µà¤¿à¤§à¤¿, à¤¸à¤‚à¤•à¥à¤·à¤¾à¤°à¤£ à¤”à¤° à¤µà¤¿à¤•à¥ƒà¤¤à¤—à¤‚à¤§à¤¿à¤¤à¤¾à¥¤"
          }
        ],
        books: [
          {
            id: "book-mp10-sci-01",
            title: "MP Board Class 10 Vigyan Prashnottari (Science Guide)",
            subject: "Science",
            chapter: "à¤¸à¤®à¥à¤ªà¥‚à¤°à¥à¤£ à¤ªà¤¾à¤ à¥à¤¯à¤•à¥à¤°à¤®",
            pages: 60,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80",
            description: "à¤¬à¥à¤²à¥‚à¤ªà¥à¤°à¤¿à¤‚à¤Ÿ à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤µà¤¸à¥à¤¤à¥à¤¨à¤¿à¤·à¥à¤  à¤ªà¥à¤°à¤¶à¥à¤¨, à¤…à¤¤à¤¿ à¤²à¤˜à¥, à¤²à¤˜à¥ à¤à¤µà¤‚ à¤¦à¥€à¤°à¥à¤˜ à¤‰à¤¤à¥à¤¤à¤°à¥€à¤¯ à¤ªà¥à¤°à¤¶à¥à¤¨à¥‹à¤¤à¥à¤¤à¤°à¥¤"
          }
        ]
      },
      {
        subjectName: "Mathematics",
        icon: "Sigma",
        color: "#FF8A00",
        lectures: [
          {
            id: "lec-mp10-math-01",
            title: "1. à¤µà¤¾à¤¸à¥à¤¤à¤µà¤¿à¤• à¤¸à¤‚à¤–à¥à¤¯à¤¾à¤à¤‚ (Real Numbers) & Euclid Division",
            duration: "23:10",
            teacher: "Smt. Vandana Sharma",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "à¤¯à¥‚à¤•à¥à¤²à¤¿à¤¡ à¤µà¤¿à¤­à¤¾à¤œà¤¨ à¤ªà¥à¤°à¤®à¥‡à¤¯à¤¿à¤•à¤¾, HCF à¤à¤µà¤‚ LCM à¤œà¥à¤žà¤¾à¤¤ à¤•à¤°à¤¨à¤¾, à¤…à¤ªà¤°à¤¿à¤®à¥‡à¤¯ à¤¸à¤‚à¤–à¥à¤¯à¤¾à¤“à¤‚ à¤•à¥€ à¤¸à¤¿à¤¦à¥à¤§à¤¿à¥¤"
          }
        ],
        books: [
          {
            id: "book-mp10-math-01",
            title: "MP Board Class 10 Ganit Formula & Solution Bank",
            subject: "Mathematics",
            chapter: "à¤—à¤£à¤¿à¤¤ à¤¸à¥‚à¤¤à¥à¤° à¤¸à¤‚à¤—à¥à¤°à¤¹",
            pages: 54,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=80",
            description: "à¤¸à¤­à¥€ à¤…à¤§à¥à¤¯à¤¾à¤¯à¥‹à¤‚ à¤•à¥‡ à¤¸à¥‚à¤¤à¥à¤°, à¤ªà¥à¤°à¤®à¥‡à¤¯à¥‹à¤‚ à¤•à¥€ à¤‰à¤ªà¤ªà¤¤à¥à¤¤à¤¿ à¤”à¤° à¤ªà¤°à¥€à¤•à¥à¤·à¤¾ à¤‰à¤ªà¤¯à¥‹à¤—à¥€ à¤¹à¤² à¤ªà¥à¤°à¤¶à¥à¤¨à¥¤"
          }
        ]
      }
    ]
  },
  {
    id: "course-cbse-9-foundation",
    title: "Class 9 CBSE All Subjects Foundation",
    subtitle: "Strong Concept Foundation for Math, Science & Social Science",
    description: "Essential foundation course designed to establish early conceptual clarity, analytical thinking, and study discipline for Class 9 students preparing for higher secondary education.",
    board: "CBSE",
    class: "Class 9",
    state: "Delhi",
    courseType: "Foundation",
    language: "English",
    subjects: ["Physics", "Chemistry", "Biology", "Mathematics"],
    teacher: "Team KITSS Master Educators",
    teacherRole: "Subject Matter Specialists",
    teacherAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    lecturesCount: 75,
    booksCount: 8,
    duration: "9 Months",
    status: "Active",
    rating: 4.8,
    reviewCount: 198,
    thumbnail: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&auto=format&fit=crop&q=80",
    expiryDate: "30 April 2027",
    isEnrolled: false,
    progressPercentage: 0,
    completedLectures: 0,
    whatYouWillLearn: [
      "Laws of motion, gravitation, and energy concepts for Class 9",
      "Structure of the atom, matter in our surroundings, and chemical formulas",
      "Cell biology, fundamental unit of life, and tissue systems",
      "Number systems, polynomials, coordinate geometry, and Euclid geometry"
    ],
    benefits: [
      "Interactive animations breaking down complex scientific phenomena",
      "Regular quizzes reinforcing key terminology and formulas",
      "Digital student handbook for smooth exam revision"
    ],
    subjectsData: [
      {
        subjectName: "Physics",
        icon: "Atom",
        color: "#133C8B",
        lectures: [
          {
            id: "lec-9-phy-01",
            title: "1. Motion: Distance, Displacement & Acceleration",
            duration: "17:40",
            teacher: "Dr. Alok Verma",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Scalar and vector quantities, uniform and non-uniform motion, graphical derivation of kinematic equations."
          }
        ],
        books: [
          {
            id: "book-9-phy-01",
            title: "Class 9 Physics Fundamentals Guide",
            subject: "Physics",
            chapter: "Motion & Laws",
            pages: 42,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&auto=format&fit=crop&q=80",
            description: "Solved numerical examples on equations of motion and graphical representations."
          }
        ]
      }
    ]
  },
  {
    id: "course-cbse-11-neet",
    title: "Class 11 NEET Medical Foundation (Biology & Chemistry)",
    subtitle: "Dual Preparation for Senior Secondary & Medical Entrance",
    description: "Designed for medical aspirants seeking a structured start in 11th grade. Intensive focus on NCERT line-by-line biology diagrams, chemical bonding, organic foundations, and mock test drills.",
    board: "CBSE",
    class: "Class 11",
    state: "Uttar Pradesh",
    courseType: "Competitive",
    language: "English",
    subjects: ["Biology", "Chemistry"],
    teacher: "Dr. Pratibha Saxena & Dr. R. K. Mishra",
    teacherRole: "Senior Medical Entrance Specialists",
    teacherAvatar: "https://images.unsplash.com/photo-1594824813719-756ef26fb16c?w=150&auto=format&fit=crop&q=80",
    lecturesCount: 95,
    booksCount: 14,
    duration: "12 Months",
    status: "Active",
    rating: 4.9,
    reviewCount: 382,
    thumbnail: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1200&auto=format&fit=crop&q=80",
    expiryDate: "15 March 2027",
    isEnrolled: false,
    price: 1499,
    originalPrice: 4999,
    discountText: "70% OFF",
    subscriptionPlans: [
      {
        id: "plan-12m",
        name: "12 Months Full NEET Master Pass",
        duration: "12 Months Access",
        price: 1499,
        originalPrice: 4999,
        discount: "70% OFF",
        isPopular: true,
        features: ["All 95 Video Lectures", "14 Digital Handbooks", "Weekly NEET Assessments", "Doubt Mentorship"]
      },
      {
        id: "plan-6m",
        name: "6 Months Semester Sprint",
        duration: "6 Months Access",
        price: 899,
        originalPrice: 2999,
        discount: "70% OFF",
        isPopular: false,
        features: ["All 95 Video Lectures", "14 Digital Handbooks", "Monthly Tests"]
      },
      {
        id: "plan-3m",
        name: "3 Months Exam Crash Course",
        duration: "3 Months Access",
        price: 499,
        originalPrice: 1499,
        discount: "66% OFF",
        isPopular: false,
        features: ["High-Yield Lectures", "Formula & Revision Notes"]
      }
    ],
    progressPercentage: 0,
    completedLectures: 0,
    whatYouWillLearn: [
      "Living World, Biological Classification, and Plant & Animal Kingdom",
      "Morphology and Anatomy of Flowering Plants",
      "Periodic Table Trends, Chemical Bonding & Molecular Orbital Theory",
      "Thermodynamics, Equilibrium, and Redox Titrations"
    ],
    benefits: [
      "NCERT line-by-line decoding in video lectures",
      "High-yield diagram annotations for NEET exam pattern",
      "Weekly diagnostic assessments with error analysis"
    ],
    subjectsData: [
      {
        subjectName: "Biology",
        icon: "Dna",
        color: "#17B26A",
        lectures: [
          {
            id: "lec-11-bio-01",
            title: "1. The Living World & Taxonomic Hierarchy",
            duration: "22:15",
            teacher: "Dr. Pratibha Saxena",
            isCompleted: false,
            isLocked: false,
            videoUrl: "/videos/sample-lecture.mp4",
            summary: "Characteristics of living organisms, binomial nomenclature rules, and taxonomic ranks."
          }
        ],
        books: [
          {
            id: "book-11-bio-01",
            title: "NEET Biology High-Yield NCERT Companion",
            subject: "Biology",
            chapter: "Diversity in Living World",
            pages: 88,
            currentPage: 1,
            isLocked: false,
            cover: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=400&auto=format&fit=crop&q=80",
            description: "Summary tables, mnemonic memory tricks, and 200 previous year NEET questions."
          }
        ]
      }
    ]
  }
];

export const INITIAL_STUDENT_PROFILE = {
  id: "KITSS20261084",
  name: "Rohan Sharma",
  email: "rohan.sharma@example.com",
  phone: "+91 98765 43210",
  dob: "2009-08-15",
  gender: "Male",
  board: "CBSE",
  class: "Class 10",
  state: "Delhi",
  city: "New Delhi",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  enrolledCourseIds: ["course-cbse-10-sci"],
  completedLectureIds: ["lec-sci-phy-01", "lec-sci-phy-02", "lec-sci-chem-01", "lec-sci-bio-01"],
  inProgressLectureIds: ["lec-sci-phy-03", "lec-sci-chem-02"],
  readingProgress: {
    "book-sci-phy-01": 18,
    "book-sci-chem-01": 24,
    "book-sci-bio-01": 30
  }
};

const STORAGE_KEY = "kits_coaching_mock_store";

export function getCoachingStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.courses) && parsed.student) {
        // Auto-migrate any broken or dead video URLs to local static review video
        let needsUpdate = false;
        (parsed.courses || []).forEach((c) => {
          // Sync pricing and plans if missing from older store
          const initialMatch = INITIAL_COACHING_COURSES.find((init) => init.id === c.id);
          if (initialMatch) {
            if (!c.price && initialMatch.price) {
              c.price = initialMatch.price;
              c.originalPrice = initialMatch.originalPrice;
              c.discountText = initialMatch.discountText;
              needsUpdate = true;
            }
            if (!c.subscriptionPlans && initialMatch.subscriptionPlans) {
              c.subscriptionPlans = initialMatch.subscriptionPlans;
              needsUpdate = true;
            }
            if (!c.language && initialMatch.language) {
              c.language = initialMatch.language;
              needsUpdate = true;
            }
          }

          (c.subjectsData || []).forEach((subj) => {
            (subj.lectures || []).forEach((lec) => {
              if (!lec.videoUrl || lec.videoUrl.includes("commondatastorage.googleapis.com")) {
                lec.videoUrl = "/videos/sample-lecture.mp4";
                needsUpdate = true;
              }
            });
          });
        });
        if (needsUpdate) {
          saveCoachingStore(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read coaching store from localStorage, using initial dataset", e);
  }

  const initial = {
    courses: INITIAL_COACHING_COURSES,
    student: INITIAL_STUDENT_PROFILE
  };
  saveCoachingStore(initial);
  return initial;
}

export function saveCoachingStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not write coaching store to localStorage", e);
  }
}

