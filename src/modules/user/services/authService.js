import { mockStudentUser, generateStudentCredentials } from "../data/mockUser";

const STORAGE_KEY = "kitss_student_user";
const AUTH_TOKEN_KEY = "kitss_auth_token";

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(userId, password, rememberMe = true) {
    await delay(500);
    // Validation check
    if (!userId || !password) {
      throw new Error("Please enter both User ID and Password.");
    }
    
    // In mock mode, allow existing user or dynamically check
    const storedUser = localStorage.getItem(STORAGE_KEY);
    let user = storedUser ? JSON.parse(storedUser) : mockStudentUser;
    
    // Generate mock token
    const token = `mock-jwt-token-${Date.now()}`;
    if (rememberMe) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    
    return { success: true, user, token };
  },

  async register(formData) {
    await delay(600);
    if (!formData.name || !formData.phone || !formData.email) {
      throw new Error("Please fill in all required registration fields.");
    }

    // Generate credentials according to FRD auto-generation requirement
    const credentials = generateStudentCredentials(formData);
    const newUser = {
      id: credentials.userId,
      name: credentials.name,
      email: credentials.email,
      phone: credentials.phone,
      dob: credentials.dob || "2009-01-01",
      board: credentials.board,
      class: credentials.class,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      joinDate: credentials.createdDate,
      streakDays: 1,
      coins: 100,
      completedLectures: 0,
      readBooks: 0
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

    return {
      success: true,
      credentials: {
        userId: credentials.userId,
        password: credentials.password,
        name: credentials.name,
        email: credentials.email
      },
      user: newUser
    };
  },

  async getCurrentUser() {
    await delay(100);
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    const storedUser = localStorage.getItem(STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : mockStudentUser;
  },

  async updateProfile(profileData) {
    await delay(400);
    const current = await this.getCurrentUser() || mockStudentUser;
    const updated = { ...current, ...profileData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { success: true, user: updated };
  },

  async forgotPassword(userIdOrEmail) {
    await delay(500);
    if (!userIdOrEmail) {
      throw new Error("Please provide your registered User ID or Email.");
    }
    return {
      success: true,
      message: `Password reset instructions and OTP have been sent to your registered contact.`
    };
  },

  async resetPassword(otp, newPassword) {
    await delay(500);
    if (!otp || !newPassword) {
      throw new Error("Please provide OTP and a new password.");
    }
    return {
      success: true,
      message: "Password has been updated successfully. You can now login."
    };
  },

  async changePassword(currentPassword, newPassword) {
    await delay(500);
    if (!currentPassword || !newPassword) {
      throw new Error("Please enter both current and new passwords.");
    }
    return {
      success: true,
      message: "Password changed successfully."
    };
  },

  async logout() {
    await delay(200);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    return { success: true };
  }
};
