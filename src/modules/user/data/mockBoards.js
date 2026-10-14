/**
 * Mock Boards & Dynamic Form Configurations for Results Module
 * Structured for seamless replacement with future API responses.
 */

export const RESULT_TYPES = [
  {
    id: "school",
    title: "Board Result",
    subtitle: "Check your board examination result.",
    badge: "Secondary & Higher Secondary",
    iconName: "GraduationCap",
    accentColor: "#0A1D3F",
  },
  {
    id: "university",
    title: "University Result",
    subtitle: "Check your university examination result.",
    badge: "Undergraduate & Postgraduate",
    iconName: "Building2",
    accentColor: "#FF8A00",
  },
  {
    id: "institute",
    title: "Institute Class / School",
    subtitle: "Franchise institute & class examination results.",
    badge: "Franchise Partners",
    iconName: "School",
    accentColor: "#133C8B",
  }
];

export const MOCK_BOARDS = {
  school: [
    {
      id: "CBSE",
      code: "CBSE",
      name: "CBSE",
      fullName: "Central Board of Secondary Education",
      description: "National curriculum board for schools across India",
      tag: "National Board",
      fields: [
        {
          id: "classGrade",
          label: "Class",
          type: "select",
          required: true,
          defaultValue: "10",
          gridSpan: "half",
          options: [
            { value: "10", label: "Class X (10th)" },
            { value: "12", label: "Class XII (12th)" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll Number",
          type: "text",
          required: true,
          placeholder: "e.g. 1024501",
          gridSpan: "half",
          validation: {
            minLength: 4,
            message: "Roll number must be at least 4 digits"
          }
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Rohan Sharma",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "School Name",
          type: "text",
          required: true,
          placeholder: "e.g. Delhi Public School, R.K. Puram",
          gridSpan: "full"
        },
        {
          id: "schoolCode",
          label: "School Code",
          type: "text",
          required: true,
          placeholder: "e.g. 85201",
          gridSpan: "half",
          validation: {
            minLength: 4,
            message: "School code must be at least 4 characters"
          }
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-08-15",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Sunita Sharma",
          gridSpan: "full"
        }
      ]
    },
    {
      id: "ICSE",
      code: "CISCE",
      name: "ICSE / ISC",
      fullName: "Council for the Indian School Certificate Examinations",
      description: "Autonomous all-India examination council",
      tag: "Council Board",
      fields: [
        {
          id: "classGrade",
          label: "Class / Course",
          type: "select",
          required: true,
          defaultValue: "ICSE",
          gridSpan: "half",
          options: [
            { value: "ICSE", label: "ICSE (Class X)" },
            { value: "ISC", label: "ISC (Class XII)" }
          ]
        },
        {
          id: "rollNumber",
          label: "Unique ID / Roll No",
          type: "text",
          required: true,
          placeholder: "e.g. 904128",
          gridSpan: "half"
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Ananya Mehta",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "School Name",
          type: "text",
          required: true,
          placeholder: "e.g. The Heritage Academy, Kolkata",
          gridSpan: "full"
        },
        {
          id: "schoolCode",
          label: "School Code",
          type: "text",
          required: true,
          placeholder: "e.g. WB084",
          gridSpan: "half"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-03-22",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Kavita Mehta",
          gridSpan: "full"
        }
      ]
    },
    {
      id: "STATE_BOARD",
      code: "STATE",
      name: "State Board",
      fullName: "State Board of Secondary & Higher Secondary Education",
      description: "Official state-specific examination boards (Maharashtra, UP, Bihar, etc.)",
      tag: "State Govt",
      fields: [
        {
          id: "stateName",
          label: "State",
          type: "select",
          required: true,
          defaultValue: "Maharashtra",
          gridSpan: "half",
          options: [
            { value: "Maharashtra", label: "Maharashtra (MSBSHSE)" },
            { value: "Uttar Pradesh", label: "Uttar Pradesh (UPMSP)" },
            { value: "Karnataka", label: "Karnataka (KSEAB)" },
            { value: "Bihar", label: "Bihar (BSEB)" },
            { value: "Tamil Nadu", label: "Tamil Nadu (TNDGE)" },
            { value: "Delhi", label: "Delhi State Board" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll / Seat Number",
          type: "text",
          required: true,
          placeholder: "e.g. SB-774120",
          gridSpan: "half"
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Aarav Patil",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "School Name",
          type: "text",
          required: true,
          placeholder: "e.g. Fergusson Junior College",
          gridSpan: "full"
        },
        {
          id: "schoolCode",
          label: "School / Center Code",
          type: "text",
          required: true,
          placeholder: "e.g. MH-11.02.001",
          gridSpan: "half"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2008-05-14",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. SUNITA",
          gridSpan: "full"
        }
      ]
    }
  ],

  university: [
    {
      id: "CENTRAL_UNIV",
      code: "CENTRAL",
      name: "Central Universities",
      fullName: "Central Universities Examination Board",
      description: "Delhi University, JNU, BHU, AMU & Allied Central Institutes",
      tag: "Central Institution",
      fields: [
        {
          id: "course",
          label: "Course / Degree",
          type: "select",
          required: true,
          defaultValue: "B.Com",
          gridSpan: "half",
          options: [
            { value: "B.Com", label: "B.Com (Honours)" },
            { value: "B.A", label: "B.A (Honours)" },
            { value: "B.Sc", label: "Bachelor of Science (B.Sc)" },
            { value: "MBA", label: "MBA" }
          ]
        },
        {
          id: "semester",
          label: "Semester",
          type: "select",
          required: true,
          defaultValue: "4",
          gridSpan: "half",
          options: [
            { value: "1", label: "Semester I" },
            { value: "2", label: "Semester II" },
            { value: "3", label: "Semester III" },
            { value: "4", label: "Semester IV" },
            { value: "5", label: "Semester V" },
            { value: "6", label: "Semester VI" }
          ]
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Aarav Gupta",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "College / Institute Name",
          type: "text",
          required: true,
          placeholder: "e.g. Faculty of Commerce, Delhi University",
          gridSpan: "full"
        },
        {
          id: "rollNumber",
          label: "Roll Number",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-66214",
          gridSpan: "full"
        }
      ]
    },
    {
      id: "STATE_TECH_UNIV",
      code: "TECH_UNIV",
      name: "State Technical University",
      fullName: "State Technical & Affiliated Universities",
      description: "Engineering, Pharmacy, Architecture, and Polytechnic Programs",
      tag: "Technical Board",
      fields: [
        {
          id: "course",
          label: "Program",
          type: "select",
          required: true,
          defaultValue: "B.Tech",
          gridSpan: "half",
          options: [
            { value: "B.Tech", label: "B.Tech (CSE)" },
            { value: "B.Tech-ECE", label: "B.Tech (ECE)" },
            { value: "B.Pharma", label: "B.Pharma" },
            { value: "MCA", label: "MCA" }
          ]
        },
        {
          id: "semester",
          label: "Semester",
          type: "select",
          required: true,
          defaultValue: "6",
          gridSpan: "half",
          options: [
            { value: "4", label: "4th Semester" },
            { value: "6", label: "6th Semester" },
            { value: "8", label: "8th Semester" }
          ]
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Kabir Singh",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "College / Institute Name",
          type: "text",
          required: true,
          placeholder: "e.g. Faculty of Engineering & Technology",
          gridSpan: "full"
        },
        {
          id: "rollNumber",
          label: "Roll / Enrollment No",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-88421",
          gridSpan: "full"
        }
      ]
    },
    {
      id: "AUTONOMOUS_UNIV",
      code: "DEEMED",
      name: "Deemed & Autonomous",
      fullName: "Deemed to be Universities & Autonomous Colleges",
      description: "Private universities, Autonomous engineering and management institutes",
      tag: "Autonomous",
      fields: [
        {
          id: "course",
          label: "Program",
          type: "select",
          required: true,
          defaultValue: "B.Tech",
          gridSpan: "half",
          options: [
            { value: "B.Tech", label: "B.Tech Computer Science" },
            { value: "BBA", label: "BBA" },
            { value: "BCA", label: "BCA" }
          ]
        },
        {
          id: "semester",
          label: "Semester",
          type: "select",
          required: true,
          defaultValue: "6",
          gridSpan: "half",
          options: [
            { value: "2", label: "Semester 2" },
            { value: "4", label: "Semester 4" },
            { value: "6", label: "Semester 6" }
          ]
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Ishaan Kapoor",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "College / Institute Name",
          type: "text",
          required: true,
          placeholder: "e.g. Apex Institute of Technology",
          gridSpan: "full"
        },
        {
          id: "rollNumber",
          label: "Registration / Roll No",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-88421",
          gridSpan: "full"
        }
      ]
    }
  ],

  institute: [
    {
      id: "APEX_INSTITUTE",
      code: "APEX",
      name: "Apex Institute",
      fullName: "Apex Institute of Technology & Management",
      description: "KITSS franchise partner — Class & diploma examination results",
      tag: "Franchise Institute",
      fields: [
        {
          id: "classGrade",
          label: "Class / Course",
          type: "select",
          required: true,
          defaultValue: "Class 10",
          gridSpan: "half",
          options: [
            { value: "Class 9", label: "Class 9" },
            { value: "Class 10", label: "Class 10" },
            { value: "Class 11", label: "Class 11" },
            { value: "Class 12", label: "Class 12" },
            { value: "B.Tech Computer Science (AI/ML)", label: "B.Tech CS (AI/ML)" },
            { value: "BBA Digital Marketing", label: "BBA Digital Marketing" },
            { value: "MCA Enterprise Architecture", label: "MCA" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll / Student ID",
          type: "text",
          required: true,
          placeholder: "e.g. INST-APX-2401",
          gridSpan: "half",
          validation: {
            minLength: 4,
            message: "Roll number must be at least 4 characters"
          }
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Rohan Sharma",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "Institute / School Name",
          type: "text",
          required: true,
          defaultValue: "Apex Institute of Technology & Management",
          placeholder: "Franchise institute name",
          gridSpan: "full"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-08-15",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Sunita Sharma",
          gridSpan: "half"
        }
      ]
    },
    {
      id: "DELHI_HERITAGE_SCHOOL",
      code: "DPHS",
      name: "Delhi Public Heritage School",
      fullName: "Delhi Public Heritage School (Franchise)",
      description: "Registered franchise school — class-wise examination results",
      tag: "Franchise School",
      fields: [
        {
          id: "classGrade",
          label: "Class",
          type: "select",
          required: true,
          defaultValue: "Class 10",
          gridSpan: "half",
          options: [
            { value: "Class 9", label: "Class 9" },
            { value: "Class 10", label: "Class 10" },
            { value: "Class 11", label: "Class 11" },
            { value: "Class 12", label: "Class 12" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll Number",
          type: "text",
          required: true,
          placeholder: "e.g. INST-DPHS-1012",
          gridSpan: "half"
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Priya Verma",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "School Name",
          type: "text",
          required: true,
          defaultValue: "Delhi Public Heritage School",
          placeholder: "Franchise school name",
          gridSpan: "full"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-11-20",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Anita Verma",
          gridSpan: "half"
        }
      ]
    },
    {
      id: "BGBA_ACADEMY",
      code: "BGBA",
      name: "Bangalore Global Academy",
      fullName: "Bangalore Global Business Academy",
      description: "KITSS franchise partner — class & program results",
      tag: "Franchise Institute",
      fields: [
        {
          id: "classGrade",
          label: "Class / Program",
          type: "select",
          required: true,
          defaultValue: "BCA Cloud & Cyber Security",
          gridSpan: "half",
          options: [
            { value: "Class 11", label: "Class 11" },
            { value: "Class 12", label: "Class 12" },
            { value: "BCA Cloud & Cyber Security", label: "BCA Cloud & Cyber Security" },
            { value: "B.Com Honours in Fintech", label: "B.Com Honours Fintech" },
            { value: "Executive MBA in AI & Leadership", label: "Executive MBA" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll / Enrollment No",
          type: "text",
          required: true,
          placeholder: "e.g. INST-BGBA-3308",
          gridSpan: "half"
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Aarav Patil",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "Institute Name",
          type: "text",
          required: true,
          defaultValue: "Bangalore Global Business Academy",
          placeholder: "Franchise institute name",
          gridSpan: "full"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2005-04-23",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Sunita Patil",
          gridSpan: "half"
        }
      ]
    },
    {
      id: "KOTA_NIST",
      code: "KNIST",
      name: "Kota National Institute",
      fullName: "Kota National Institute of Science & Technology",
      description: "Franchise science & class coaching examination results",
      tag: "Franchise Institute",
      fields: [
        {
          id: "classGrade",
          label: "Class / Course",
          type: "select",
          required: true,
          defaultValue: "Class 12",
          gridSpan: "half",
          options: [
            { value: "Class 9", label: "Class 9" },
            { value: "Class 10", label: "Class 10" },
            { value: "Class 11", label: "Class 11 Science" },
            { value: "Class 12", label: "Class 12 Science" },
            { value: "Foundation NEET", label: "Foundation NEET" },
            { value: "Foundation JEE", label: "Foundation JEE" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll Number",
          type: "text",
          required: true,
          placeholder: "e.g. INST-KOTA-5510",
          gridSpan: "half"
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Kabir Singh",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "Institute Name",
          type: "text",
          required: true,
          defaultValue: "Kota National Institute of Science & Technology",
          placeholder: "Franchise institute name",
          gridSpan: "full"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2008-01-12",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Pooja Singh",
          gridSpan: "half"
        }
      ]
    },
    {
      id: "OTHER_INSTITUTE",
      code: "OTHER",
      name: "Other Institute / School",
      fullName: "Other Registered Franchise Institute or School",
      description: "Type and check result for an institute not listed above",
      tag: "Custom",
      fields: [
        {
          id: "classGrade",
          label: "Class / Course",
          type: "select",
          required: true,
          defaultValue: "Class 10",
          gridSpan: "half",
          options: [
            { value: "Class 9", label: "Class 9" },
            { value: "Class 10", label: "Class 10" },
            { value: "Class 11", label: "Class 11" },
            { value: "Class 12", label: "Class 12" },
            { value: "Diploma", label: "Diploma" },
            { value: "Other Course", label: "Other Course" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll / Student ID",
          type: "text",
          required: true,
          placeholder: "e.g. INST-1001",
          gridSpan: "half",
          validation: {
            minLength: 4,
            message: "Roll number must be at least 4 characters"
          }
        },
        {
          id: "studentName",
          label: "Student Name",
          type: "text",
          required: true,
          placeholder: "e.g. Rohan Sharma",
          gridSpan: "full"
        },
        {
          id: "schoolName",
          label: "Institute / School Name",
          type: "text",
          required: true,
          placeholder: "Type your institute or school name",
          gridSpan: "full"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-08-15",
          gridSpan: "half"
        },
        {
          id: "motherName",
          label: "Mother's Name",
          type: "text",
          required: true,
          placeholder: "e.g. Sunita Sharma",
          gridSpan: "half"
        }
      ]
    }
  ]
};

/**
 * Quick Test Demo Chips to make it effortless for any reviewer or tester
 * to test every path in 1 click!
 */
export const DEMO_PRESETS = [
  {
    type: "school",
    boardId: "CBSE",
    label: "CBSE 10th (Distinction - 94.4%)",
    rollNumber: "1024501",
    studentName: "ROHAN SHARMA",
    schoolName: "Delhi Public School, R.K. Puram, New Delhi",
    schoolCode: "85201",
    motherName: "SUNITA SHARMA",
    dob: "2009-08-15"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "CBSE 10th (Pass - 89.8%)",
    rollNumber: "1024502",
    studentName: "PRIYA VERMA",
    schoolName: "Modern School, Barakhamba Road, New Delhi",
    schoolCode: "85208",
    motherName: "ANITA VERMA",
    dob: "2009-11-20"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "CBSE 12th Science (92.6%)",
    rollNumber: "1224501",
    studentName: "ARJUN MEHTA",
    schoolName: "Delhi Public School, R.K. Puram, New Delhi",
    schoolCode: "85201",
    motherName: "NEHA MEHTA",
    dob: "2007-06-18"
  },
  {
    type: "school",
    boardId: "ICSE",
    label: "ICSE 10th (Ananya - 95.2%)",
    rollNumber: "ICSE-90412",
    studentName: "ANANYA MEHTA",
    schoolName: "The Heritage Academy, Kolkata",
    schoolCode: "WB084",
    motherName: "KAVITA MEHTA",
    dob: "2009-03-22"
  },
  {
    type: "school",
    boardId: "STATE_BOARD",
    label: "State Board HSC (86.5%)",
    rollNumber: "SB-774120",
    studentName: "AARAV PATIL",
    schoolName: "Fergusson Junior College",
    schoolCode: "MH-11.02.001",
    motherName: "SUNITA",
    dob: "2008-05-14"
  },
  {
    type: "university",
    boardId: "STATE_TECH_UNIV",
    label: "B.Tech Sem 6 (CGPA 8.92)",
    rollNumber: "UNV-88421",
    studentName: "KABIR SINGH",
    schoolName: "Faculty of Engineering & Technology"
  },
  {
    type: "university",
    boardId: "CENTRAL_UNIV",
    label: "B.Com Sem 4 (DU - 81.4%)",
    rollNumber: "UNV-66214",
    studentName: "AARAV GUPTA",
    schoolName: "Faculty of Commerce, Delhi University"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "Compartment / Fail Test",
    rollNumber: "1024503",
    studentName: "VIHAN KAPOOR",
    schoolName: "St. Xavier's School, Delhi",
    schoolCode: "85215",
    motherName: "POOJA KAPOOR",
    dob: "2009-04-12"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "Test 'No Result Found'",
    rollNumber: "999999",
    studentName: "TEST STUDENT",
    schoolName: "Demo Public School",
    schoolCode: "00000",
    motherName: "TEST MOTHER",
    dob: "2009-01-01"
  },
  {
    type: "institute",
    boardId: "APEX_INSTITUTE",
    label: "Apex Institute Class 10 (91.2%)",
    rollNumber: "INST-APX-2401",
    studentName: "ROHAN SHARMA",
    schoolName: "Apex Institute of Technology & Management",
    motherName: "SUNITA SHARMA",
    classGrade: "Class 10",
    dob: "2009-08-15"
  },
  {
    type: "institute",
    boardId: "DELHI_HERITAGE_SCHOOL",
    label: "Heritage School Class 10 (88.4%)",
    rollNumber: "INST-DPHS-1012",
    studentName: "PRIYA VERMA",
    schoolName: "Delhi Public Heritage School",
    motherName: "ANITA VERMA",
    classGrade: "Class 10",
    dob: "2009-11-20"
  }
];
