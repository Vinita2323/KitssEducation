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
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-08-15",
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
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: true,
          defaultValue: "2009-03-22",
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
          id: "dob",
          label: "Date of Birth",
          type: "date",
          required: false,
          defaultValue: "2008-05-14",
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
          id: "rollNumber",
          label: "Registration / Roll No",
          type: "text",
          required: true,
          placeholder: "e.g. UNV-88421",
          gridSpan: "full"
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
