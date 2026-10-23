export const mockOrders = [
  {
    id: "ORD-2026-8841",
    productName: "Class 10 Complete Course (CBSE)",
    type: "Course",
    category: "Online Coaching",
    date: "15 Jan 2026, 02:45 PM",
    amount: 999,
    originalAmount: 1499,
    discountAmount: 500,
    paymentMethod: "UPI (Google Pay)",
    transactionId: "TXN_UPI_9988771122",
    status: "Paid",
    invoiceUrl: "#",
    items: [
      { name: "Class 10 Complete Course (CBSE) - 1 Year Subscription", price: 999, qty: 1 }
    ]
  },
  {
    id: "ORD-2026-7732",
    productName: "Mathematics - Class 10 (CBSE)",
    type: "Book",
    category: "Digital Books",
    date: "10 Jan 2026, 11:15 AM",
    amount: 199,
    originalAmount: 299,
    discountAmount: 100,
    paymentMethod: "Credit Card (Visa **** 4012)",
    transactionId: "TXN_CC_4411883399",
    status: "Paid",
    invoiceUrl: "#",
    items: [
      { name: "Mathematics Class 10 CBSE Digital E-Book (PDF)", price: 199, qty: 1 }
    ]
  },
  {
    id: "ORD-2026-6629",
    productName: "Science: Life Processes & Chemical Reactions",
    type: "Book",
    category: "Digital Books",
    date: "05 Jan 2026, 04:30 PM",
    amount: 189,
    originalAmount: 280,
    discountAmount: 91,
    paymentMethod: "UPI (PhonePe)",
    transactionId: "TXN_UPI_3322119900",
    status: "Paid",
    invoiceUrl: "#",
    items: [
      { name: "Science: Life Processes Class 10 CBSE (PDF)", price: 189, qty: 1 }
    ]
  },
  {
    id: "ORD-2026-5510",
    productName: "Physics Master Guide - Class 11",
    type: "Book",
    category: "Digital Books",
    date: "28 Dec 2025, 08:20 PM",
    amount: 249,
    originalAmount: 399,
    discountAmount: 150,
    paymentMethod: "Net Banking (SBI)",
    transactionId: "TXN_NB_77665544",
    status: "Failed",
    failureReason: "Bank server timeout during authorization",
    invoiceUrl: "#",
    items: [
      { name: "Physics Master Guide Class 11 (PDF)", price: 249, qty: 1 }
    ]
  }
];
