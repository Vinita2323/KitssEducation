export const mockStudentUser = {
  id: "KITSS20261084",
  name: "Rohan Sharma",
  email: "rohan.sharma@example.com",
  phone: "+91 98765 43210",
  board: "CBSE",
  class: "Class 10",
  dob: "2009-08-15",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  joinDate: "January 2026",
  city: "New Delhi",
  state: "Delhi",
  pincode: "110001",
  streakDays: 14,
  coins: 450,
  completedLectures: 38,
  readBooks: 9,
  targetExam: "CBSE Board 2026"
};

export const generateStudentCredentials = (formData) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const userId = `KITSS${new Date().getFullYear()}${randomNum}`;
  const generatedPassword = `Kits@${Math.floor(1000 + Math.random() * 9000)}`;
  
  return {
    userId,
    password: generatedPassword,
    name: formData.name || "New Student",
    email: formData.email,
    phone: formData.phone,
    dob: formData.dob,
    state: formData.state || "Delhi",
    board: formData.board || "CBSE",
    class: formData.class || "Class 10",
    createdDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };
};
