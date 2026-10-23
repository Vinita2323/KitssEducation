export const mockCourseCategories = [
  { id: "CBSE", name: "CBSE", icon: "GraduationCap", color: "from-blue-600 to-indigo-700" },
  { id: "State Board", name: "State Board", icon: "Building2", color: "from-amber-500 to-orange-600" },
  { id: "JEE", name: "JEE", icon: "Trophy", color: "from-emerald-600 to-teal-700" },
  { id: "NEET", name: "NEET", icon: "HeartPulse", color: "from-rose-500 to-pink-600" },
];

export const mockCourses = [
  {
    id: "course-201",
    title: "Class 10 Complete Course (CBSE)",
    subtitle: "Full Syllabus Coverage: Math, Science & English",
    category: "CBSE",
    board: "CBSE",
    class: "10",
    videoCount: 52,
    testCount: 12,
    rating: 4.8,
    reviewCount: 340,
    price: 999,
    originalPrice: 1499,
    discount: "33% OFF",
    isSubscribed: true,
    thumbnail: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80",
    instructor: "Dr. Alok Verma & Er. Neha Gupta",
    instructorRole: "Senior CBSE Educators (12+ Yrs Exp)",
    instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Complete preparation for Class 10 CBSE Board exams with 100% syllabus coverage, conceptual video lectures, topic notes, formula sheets, chapter-wise MCQs and full-length simulated test series.",
    features: [
      { id: "live", title: "Live Classes", description: "Weekly doubt resolution & live problem sessions" },
      { id: "recorded", title: "Recorded Lectures", description: "50+ HD chapter lectures accessible anytime" },
      { id: "notes", title: "Study Material", description: "Comprehensive PDF notes & formula cheat sheets" },
      { id: "tests", title: "Practice Tests", description: "12 Mock tests with instant percentile & ranking" },
      { id: "doubt", title: "Doubt Support", description: "Direct Q&A with teacher assistance within 24 hours" },
    ],
    chapters: [
      {
        id: "ch-1",
        title: "Chapter 1: Linear Equations in Two Variables",
        lecturesCount: 4,
        duration: "56 mins",
        lectures: [
          {
            id: "lec-101",
            title: "1. Introduction & Standard Forms",
            duration: "10:20",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: true,
            notes: "Introduction to ax + by + c = 0, geometrical representation as straight lines.",
            resources: [
              { name: "Lecture-01-Notes.pdf", size: "2.1 MB" },
              { name: "Formula-Sheet.pdf", size: "850 KB" }
            ]
          },
          {
            id: "lec-102",
            title: "2. Terms, Expressions & Graphical Method",
            duration: "12:15",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: true,
            notes: "Consistent vs Inconsistent systems, intersecting vs parallel vs coincident lines.",
            resources: [
              { name: "Graphical-Method-Worksheet.pdf", size: "1.4 MB" }
            ]
          },
          {
            id: "lec-103",
            title: "3. Algebraic Methods: Substitution & Elimination",
            duration: "18:30",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: true,
            notes: "Stepwise substitution, coefficient balancing in elimination method.",
            resources: [
              { name: "Algebraic-Methods-Solved-Examples.pdf", size: "3.0 MB" }
            ]
          },
          {
            id: "lec-104",
            title: "4. Word Problems & Practical Applications",
            duration: "15:10",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "Speed-time-distance problems, age problems, upstream/downstream boat cases.",
            resources: [
              { name: "Word-Problems-Master-Practice.pdf", size: "1.8 MB" }
            ]
          }
        ]
      },
      {
        id: "ch-2",
        title: "Chapter 2: Quadratic Equations",
        lecturesCount: 4,
        duration: "1 hr 12 mins",
        lectures: [
          {
            id: "lec-201",
            title: "1. Standard Quadratic Form & Factorisation",
            duration: "16:40",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "Roots of axÂ² + bx + c = 0 by splitting the middle term.",
            resources: [{ name: "Factorisation-Guide.pdf", size: "1.2 MB" }]
          },
          {
            id: "lec-202",
            title: "2. Quadratic Formula & Discriminant Analysis",
            duration: "18:25",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "Nature of roots based on D = bÂ² - 4ac (real, distinct, equal, imaginary).",
            resources: [{ name: "Discriminant-Chart.pdf", size: "900 KB" }]
          }
        ]
      },
      {
        id: "ch-3",
        title: "Chapter 3: Triangles & Similar Figures",
        lecturesCount: 5,
        duration: "1 hr 30 mins",
        lectures: [
          {
            id: "lec-301",
            title: "1. Basic Proportionality Theorem (Thales Theorem)",
            duration: "20:10",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "Full formal geometric proof and converse with board questions.",
            resources: [{ name: "BPT-Proofs.pdf", size: "2.5 MB" }]
          }
        ]
      }
    ]
  },
  {
    id: "course-202",
    title: "Class 12 Physics Masterclass",
    subtitle: "Electrostatics, Optics & Modern Physics (CBSE + State)",
    category: "CBSE",
    board: "CBSE",
    class: "12",
    videoCount: 68,
    testCount: 18,
    rating: 4.9,
    reviewCount: 420,
    price: 1299,
    originalPrice: 1999,
    discount: "35% OFF",
    isSubscribed: false,
    thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80",
    instructor: "Er. K. N. Rao",
    instructorRole: "Ex-IITian & Physics Mentor",
    instructorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    description: "Master Class 12 Physics with intuitive 3D simulations, derivations breakdown, circuit numericals, and board paper writing strategies.",
    features: [
      { id: "live", title: "Live Classes", description: "Weekly live numerical problem sessions" },
      { id: "recorded", title: "Recorded Lectures", description: "68 HD derivations & chapter recordings" },
      { id: "notes", title: "Study Material", description: "Derivation cheat sheet + formula handbook" },
      { id: "tests", title: "Practice Tests", description: "18 Chapterwise & 5 full length board mock tests" },
      { id: "doubt", title: "Doubt Support", description: "Dedicated WhatsApp & in-app chat assistance" }
    ],
    chapters: [
      {
        id: "ch-p1",
        title: "Chapter 1: Electric Charges and Fields",
        lecturesCount: 6,
        duration: "1 hr 45 mins",
        lectures: [
          {
            id: "lec-p101",
            title: "1. Coulomb's Law & Principle of Superposition",
            duration: "18:40",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "Vector form of Coulomb's Law, dielectric constant.",
            resources: [{ name: "Electrostatics-Derivations.pdf", size: "3.2 MB" }]
          }
        ]
      }
    ]
  },
  {
    id: "course-203",
    title: "JEE Main & Advanced Mathematics Booster",
    subtitle: "Calculus, Coordinate Geometry & Vectors",
    category: "JEE",
    board: "Competitive",
    class: "11-12",
    videoCount: 84,
    testCount: 25,
    rating: 4.9,
    reviewCount: 512,
    price: 1999,
    originalPrice: 2999,
    discount: "33% OFF",
    isSubscribed: false,
    thumbnail: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    instructor: "Prof. Rajesh Agarwal",
    instructorRole: "JEE Math Expert (15+ Yrs Exp)",
    instructorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    description: "High-yield shortcut tricks, graphical problem-solving approaches, and past 15 years' JEE Main & Advanced questions categorized by difficulty level.",
    features: [
      { id: "live", title: "Live Classes", description: "Advanced problem solving live sessions" },
      { id: "recorded", title: "Recorded Lectures", description: "84 Deep conceptual booster lectures" },
      { id: "notes", title: "Study Material", description: "Olympiad and JEE Level question banks" },
      { id: "tests", title: "Practice Tests", description: "25 NTA pattern computer-based tests (CBT)" },
      { id: "doubt", title: "Doubt Support", description: "1-on-1 mentor guidance" }
    ],
    chapters: [
      {
        id: "ch-j1",
        title: "Chapter 1: Differential Calculus & Limits",
        lecturesCount: 8,
        duration: "2 hrs 20 mins",
        lectures: [
          {
            id: "lec-j101",
            title: "1. Advanced Limits & L'Hopital Rule Shortcut Tricks",
            duration: "24:10",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "Series expansion method, 0/0 and âˆž/âˆž forms.",
            resources: [{ name: "JEE-Limits-Mastery.pdf", size: "4.1 MB" }]
          }
        ]
      }
    ]
  },
  {
    id: "course-204",
    title: "NEET Biology Comprehensive Crash Course",
    subtitle: "NCERT Line-by-Line & Diagrammatic Recall",
    category: "NEET",
    board: "Competitive",
    class: "11-12",
    videoCount: 75,
    testCount: 20,
    rating: 4.8,
    reviewCount: 388,
    price: 1799,
    originalPrice: 2499,
    discount: "28% OFF",
    isSubscribed: false,
    thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    instructor: "Dr. Sunita Deshmukh",
    instructorRole: "MBBS, Medical Faculty Mentor",
    instructorAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    description: "Complete NCERT Line-by-Line coverage for NEET 360/360 target with memory retention mnemonics, diagram drills, and previous year assertion-reason questions.",
    features: [
      { id: "live", title: "Live Classes", description: "Daily NCERT line explanation & doubt rooms" },
      { id: "recorded", title: "Recorded Lectures", description: "75 Biology video lectures with 3D visuals" },
      { id: "notes", title: "Study Material", description: "Biology NCERT extraction bullet notes" },
      { id: "tests", title: "Practice Tests", description: "20 Topic-wise & full syllabus OMR mock tests" },
      { id: "doubt", title: "Doubt Support", description: "Instant faculty doubt chat" }
    ],
    chapters: [
      {
        id: "ch-b1",
        title: "Chapter 1: Human Physiology - Digestion & Breathing",
        lecturesCount: 6,
        duration: "1 hr 50 mins",
        lectures: [
          {
            id: "lec-b101",
            title: "1. Gastrointestinal Tract & Enzymatic Actions",
            duration: "22:15",
            videoUrl: "/videos/sample-lecture.mp4",
            isCompleted: false,
            notes: "NCERT tables for salivary, gastric, pancreatic, and intestinal enzymes.",
            resources: [{ name: "Human-Physio-Notes.pdf", size: "3.8 MB" }]
          }
        ]
      }
    ]
  }
];

