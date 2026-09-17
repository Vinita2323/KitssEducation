/**
 * Mock Boards & Dynamic Form Configurations for Results Module
 * Structured for seamless replacement with future API responses.
 */

export const RESULT_TYPES = [
  {
    id: "school",
    title: "School Result",
    subtitle: "Check your school examination or board result.",
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
          id: "academicYear",
          label: "Academic Session",
          type: "select",
          required: true,
          defaultValue: "2026",
          gridSpan: "half",
          options: [
            { value: "2026", label: "2025 - 2026 (Latest)" },
            { value: "2025", label: "2024 - 2025" },
            { value: "2024", label: "2023 - 2024" }
          ]
        },
        {
          id: "classGrade",
          label: "Examination Class",
          type: "select",
          required: true,
          defaultValue: "10",
          gridSpan: "half",
          options: [
            { value: "10", label: "Class X (Secondary School)" },
            { value: "12", label: "Class XII (Senior School Certificate)" }
          ]
        },
        {
          id: "examType",
          label: "Examination Type",
          type: "select",
          required: true,
          defaultValue: "main",
          gridSpan: "half",
          options: [
            { value: "main", label: "Main Annual Examination" },
            { value: "compartment", label: "Compartment / Supplementary" },
            { value: "improvement", label: "Improvement Examination" }
          ]
        },
        {
          id: "schoolCode",
          label: "School Code (5 Digits)",
          type: "text",
          required: false,
          placeholder: "e.g. 85201",
          helperText: "Found on your official Admit Card",
          gridSpan: "half",
          validation: {
            pattern: "^[0-9]{5}$",
            message: "School code must be a 5-digit number"
          }
        },
        {
          id: "rollNumber",
          label: "Roll Number",
          type: "text",
          required: true,
          placeholder: "Enter 7 or 8-digit Roll Number (e.g. 1024501)",
          gridSpan: "half",
          helperText: "As mentioned on your Admit Card",
          validation: {
            minLength: 4,
            message: "Roll number must be at least 4 digits"
          }
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-08-15",
          gridSpan: "half",
          helperText: "Required for identity verification"
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
          id: "academicYear",
          label: "Academic Year",
          type: "select",
          required: true,
          defaultValue: "2026",
          gridSpan: "half",
          options: [
            { value: "2026", label: "Examination 2026" },
            { value: "2025", label: "Examination 2025" }
          ]
        },
        {
          id: "classGrade",
          label: "Course",
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
          label: "Unique ID (UID)",
          type: "text",
          required: true,
          placeholder: "7-digit Unique ID (e.g. ICSE-90412)",
          gridSpan: "half",
          helperText: "Unique 7-digit ID assigned to candidate"
        },
        {
          id: "indexNumber",
          label: "Index Number",
          type: "text",
          required: true,
          placeholder: "e.g. B/9452/012",
          gridSpan: "half",
          helperText: "Provided by your school center"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-03-22",
          gridSpan: "full",
          helperText: "DD/MM/YYYY format matching school record"
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
          label: "Select State",
          type: "select",
          required: true,
          defaultValue: "Maharashtra",
          gridSpan: "half",
          options: [
            { value: "Maharashtra", label: "Maharashtra State Board (MSBSHSE)" },
            { value: "Uttar Pradesh", label: "UP Board (UPMSP)" },
            { value: "Karnataka", label: "Karnataka School Examination (KSEAB)" },
            { value: "Bihar", label: "Bihar School Examination (BSEB)" },
            { value: "Tamil Nadu", label: "Tamil Nadu Directorate of Govt Exams" },
            { value: "Delhi", label: "Delhi State Education Board" }
          ]
        },
        {
          id: "classGrade",
          label: "Examination Level",
          type: "select",
          required: true,
          defaultValue: "HSC",
          gridSpan: "half",
          options: [
            { value: "SSLC", label: "10th Standard (SSLC / Matriculation)" },
            { value: "HSC", label: "12th Standard (HSC / Intermediate)" }
          ]
        },
        {
          id: "academicYear",
          label: "Examination Year",
          type: "select",
          required: true,
          defaultValue: "2026",
          gridSpan: "half",
          options: [
            { value: "2026", label: "Annual Exam 2026" },
            { value: "2025", label: "Annual Exam 2025" }
          ]
        },
        {
          id: "rollNumber",
          label: "Seat Number / Roll Number",
          type: "text",
          required: true,
          placeholder: "e.g. SB-774120",
          gridSpan: "half",
          helperText: "Alphanumeric Seat Number from Hall Ticket"
        },
        {
          id: "motherName",
          label: "Mother's First Name",
          type: "text",
          required: true,
          placeholder: "e.g. SUNITA",
          gridSpan: "half",
          helperText: "Required verification field for State Board"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: false,
          gridSpan: "half"
        }
      ]
    },
    {
      id: "OTHER_BOARD",
      code: "OTHER",
      name: "Other Board",
      fullName: "Other Recognized National & Open Schooling Boards",
      description: "NIOS, Cambridge IGCSE, International Baccalaureate (IB), and others",
      tag: "Alternative Boards",
      fields: [
        {
          id: "boardName",
          label: "Recognized Board Name",
          type: "select",
          required: true,
          defaultValue: "NIOS",
          gridSpan: "half",
          options: [
            { value: "NIOS", label: "National Institute of Open Schooling (NIOS)" },
            { value: "CAMBRIDGE", label: "Cambridge Assessment International (IGCSE/A-Level)" },
            { value: "IB", label: "International Baccalaureate (IB Diploma)" },
            { value: "OTHER", label: "Other Recognized Board" }
          ]
        },
        {
          id: "academicYear",
          label: "Examination Session",
          type: "select",
          required: true,
          defaultValue: "2026",
          gridSpan: "half",
          options: [
            { value: "2026", label: "Session 2025-2026" },
            { value: "2025", label: "Session 2024-2025" }
          ]
        },
        {
          id: "rollNumber",
          label: "Enrollment / Candidate Number",
          type: "text",
          required: true,
          placeholder: "e.g. NIOS-489211",
          gridSpan: "half",
          helperText: "Unique enrollment number"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2008-05-14",
          gridSpan: "half"
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
          id: "universityName",
          label: "University / Institute",
          type: "select",
          required: true,
          defaultValue: "University of Delhi",
          gridSpan: "half",
          options: [
            { value: "University of Delhi", label: "University of Delhi (DU)" },
            { value: "Banaras Hindu University", label: "Banaras Hindu University (BHU)" },
            { value: "Jawaharlal Nehru University", label: "Jawaharlal Nehru University (JNU)" },
            { value: "Jamia Millia Islamia", label: "Jamia Millia Islamia (JMI)" }
          ]
        },
        {
          id: "course",
          label: "Course / Degree Program",
          type: "select",
          required: true,
          defaultValue: "B.Com",
          gridSpan: "half",
          options: [
            { value: "B.Com", label: "Bachelor of Commerce (Honours)" },
            { value: "B.A", label: "Bachelor of Arts (Honours)" },
            { value: "B.Sc", label: "Bachelor of Science" },
            { value: "MBA", label: "Master of Business Administration" }
          ]
        },
        {
          id: "semester",
          label: "Semester / Year",
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
          id: "academicYear",
          label: "Examination Session",
          type: "select",
          required: true,
          defaultValue: "2026",
          gridSpan: "half",
          options: [
            { value: "2026", label: "May-June 2026 Regular" },
            { value: "2025", label: "Nov-Dec 2025 Winter" }
          ]
        },
        {
          id: "rollNumber",
          label: "Roll Number / Examination Roll",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-66214",
          gridSpan: "half",
          helperText: "College Examination Roll Number"
        },
        {
          id: "enrollmentNumber",
          label: "Enrollment Number",
          type: "text",
          required: false,
          placeholder: "e.g. 22DU-884102",
          gridSpan: "half",
          helperText: "Permanent University Enrollment Number"
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
          id: "universityName",
          label: "Technical University",
          type: "select",
          required: true,
          defaultValue: "State Technological University",
          gridSpan: "half",
          options: [
            { value: "State Technological University", label: "State Technological University (STU)" },
            { value: "APJ Abdul Kalam Technical University", label: "Dr. A.P.J. Abdul Kalam Technical University" },
            { value: "Visvesvaraya Technological University", label: "Visvesvaraya Technological University (VTU)" },
            { value: "Anna University", label: "Anna University Technical Board" }
          ]
        },
        {
          id: "course",
          label: "Degree Program",
          type: "select",
          required: true,
          defaultValue: "B.Tech",
          gridSpan: "half",
          options: [
            { value: "B.Tech", label: "Bachelor of Technology (B.Tech - CSE)" },
            { value: "B.Tech-ECE", label: "Bachelor of Technology (B.Tech - ECE)" },
            { value: "B.Pharma", label: "Bachelor of Pharmacy (B.Pharm)" },
            { value: "MCA", label: "Master of Computer Applications (MCA)" }
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
            { value: "4", label: "4th Semester (2nd Year)" },
            { value: "6", label: "6th Semester (3rd Year)" },
            { value: "8", label: "8th Semester (Final Year)" }
          ]
        },
        {
          id: "academicYear",
          label: "Examination Year",
          type: "select",
          required: true,
          defaultValue: "2026",
          gridSpan: "half",
          options: [
            { value: "2026", label: "Even Semester 2026" },
            { value: "2025", label: "Odd Semester 2025" }
          ]
        },
        {
          id: "rollNumber",
          label: "University Roll / Enrollment No",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-88421",
          gridSpan: "half",
          helperText: "Unique student enrollment identifier"
        },
        {
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: false,
          gridSpan: "half"
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
          id: "universityName",
          label: "Institute Name",
          type: "select",
          required: true,
          defaultValue: "KITSS Deemed University",
          gridSpan: "half",
          options: [
            { value: "KITSS Deemed University", label: "KITSS Institute of Higher Education" },
            { value: "Autonomous Engineering College", label: "Autonomous Engineering College" },
            { value: "Global Business Institute", label: "Global Business Institute" }
          ]
        },
        {
          id: "course",
          label: "Program",
          type: "select",
          required: true,
          defaultValue: "B.Tech",
          gridSpan: "half",
          options: [
            { value: "B.Tech", label: "B.Tech Computer Science" },
            { value: "BBA", label: "Bachelor of Business Administration" },
            { value: "BCA", label: "Bachelor of Computer Applications" }
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
          id: "rollNumber",
          label: "Registration Number",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-88421",
          gridSpan: "half",
          helperText: "Registration ID found on Student Portal ID"
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
    dob: "2009-08-15"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "CBSE 10th (Pass - 89.8%)",
    rollNumber: "1024502",
    dob: "2009-11-20"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "CBSE 12th Science (92.6%)",
    rollNumber: "1224501",
    dob: "2007-06-18"
  },
  {
    type: "school",
    boardId: "ICSE",
    label: "ICSE 10th (Ananya - 95.2%)",
    rollNumber: "ICSE-90412",
    dob: "2009-03-22"
  },
  {
    type: "school",
    boardId: "STATE_BOARD",
    label: "State Board HSC (86.5%)",
    rollNumber: "SB-774120",
    motherName: "SUNITA"
  },
  {
    type: "university",
    boardId: "STATE_TECH_UNIV",
    label: "B.Tech Sem 6 (CGPA 8.92)",
    rollNumber: "UNV-88421"
  },
  {
    type: "university",
    boardId: "CENTRAL_UNIV",
    label: "B.Com Sem 4 (DU - 81.4%)",
    rollNumber: "UNV-66214"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "Compartment / Fail Test",
    rollNumber: "1024503",
    dob: "2009-04-12"
  },
  {
    type: "school",
    boardId: "CBSE",
    label: "Test 'No Result Found'",
    rollNumber: "999999"
  }
];
