import { mockStudentUser, generateStudentCredentials } from "../data/mockUser";

const STORAGE_KEY = "kitss_student_user";
const AUTH_TOKEN_KEY = "kitss_auth_token";
const DEVICE_ID_KEY = "kitss_device_id";
const ACTIVE_SESSION_KEY = "kitss_active_device_session";
const USERS_REGISTRY_KEY = "kitss_registered_users";
const LAST_CREDENTIALS_KEY = "kitss_last_registered_credentials";

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultRegisteredUsers = [
  {
    ...mockStudentUser,
    password: "student123",
  },
];

function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) {
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(defaultRegisteredUsers));
      return defaultRegisteredUsers;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list : defaultRegisteredUsers;
  } catch {
    return defaultRegisteredUsers;
  }
}

function saveRegisteredUser(user) {
  try {
    const users = getRegisteredUsers();
    const index = users.findIndex(
      (u) =>
        u.id?.toLowerCase() === user.id?.toLowerCase() ||
        (user.email && u.email?.toLowerCase() === user.email?.toLowerCase())
    );
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Error saving registered user:", err);
  }
}

export const authService = {
  // 1. Device Detection & Fingerprint Helper
  getOrGenerateDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `DEV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  },

  getCurrentDeviceInfo() {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    let browser = "Web Browser";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";

    let os = "PC";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    const deviceId = this.getOrGenerateDeviceId();
    const type = isMobile ? "Mobile" : "PC / Desktop";
    const label = `${browser} on ${os} (${type})`;

    return {
      deviceId,
      type,
      browser,
      os,
      label,
    };
  },

  // 2. Validate if current device is the single authorized device
  validateDeviceSession(userId) {
    if (!userId) return { valid: true };
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return { valid: true };

    try {
      const activeSession = JSON.parse(raw);
      const currentDeviceId = this.getOrGenerateDeviceId();
      // If session belongs to this user but another device
      if (activeSession.userId === userId && activeSession.deviceId !== currentDeviceId) {
        return {
          valid: false,
          conflict: true,
          activeDevice: activeSession.deviceLabel || "Another device",
          loginTime: activeSession.loginTime,
        };
      }
      return { valid: true, activeSession };
    } catch {
      return { valid: true };
    }
  },

  // 3. Transfer session to current device (terminating other device access)
  transferSessionToCurrentDevice(userId) {
    const deviceInfo = this.getCurrentDeviceInfo();
    const sessionData = {
      userId,
      deviceId: deviceInfo.deviceId,
      deviceLabel: deviceInfo.label,
      deviceType: deviceInfo.type,
      loginTime: new Date().toISOString(),
      lastActiveTime: Date.now(),
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
    return { success: true, session: sessionData };
  },

  // 4. Get last registered credentials from storage
  getLastRegisteredCredentials() {
    try {
      const raw = localStorage.getItem(LAST_CREDENTIALS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // 5. Save registered student (from coaching or external flow)
  saveRegisteredStudent(studentData) {
    const generatedPassword = studentData.password || `Kits@${Math.floor(1000 + Math.random() * 9000)}`;
    const studentUser = {
      ...studentData,
      password: generatedPassword,
    };
    saveRegisteredUser(studentUser);
    const creds = {
      userId: studentUser.id,
      password: generatedPassword,
      name: studentUser.name,
      email: studentUser.email,
    };
    localStorage.setItem(LAST_CREDENTIALS_KEY, JSON.stringify(creds));
    return creds;
  },

  // 6. Login with User ID / Email and Password
  async login(userIdOrEmail, password, rememberMe = true) {
    await delay(400);

    const cleanInput = (userIdOrEmail || "").trim();
    const cleanPassword = (password || "").trim();

    if (!cleanInput || !cleanPassword) {
      throw new Error("Please enter both User ID and Password.");
    }

    const users = getRegisteredUsers();

    // Match by User ID (case-insensitive), Email (case-insensitive), or phone
    const user = users.find((u) => {
      const idMatch = u.id && u.id.toLowerCase() === cleanInput.toLowerCase();
      const emailMatch = u.email && u.email.toLowerCase() === cleanInput.toLowerCase();
      const phoneMatch = u.phone && u.phone.replace(/\D/g, "") === cleanInput.replace(/\D/g, "");
      return idMatch || emailMatch || phoneMatch;
    });

    if (!user) {
      throw new Error(
        `User "${cleanInput}" not found. Please verify your Student User ID or register for an account.`
      );
    }

    // Check Password
    if (user.password && user.password !== cleanPassword) {
      throw new Error("Incorrect password. Please check your auto-generated credentials.");
    }

    // Check single device session binding
    const sessionCheck = this.validateDeviceSession(user.id);
    if (!sessionCheck.valid && sessionCheck.conflict) {
      return {
        success: false,
        deviceConflict: true,
        activeDevice: sessionCheck.activeDevice,
        loginTime: sessionCheck.loginTime,
        user,
      };
    }

    // Register current device as the single active session
    this.transferSessionToCurrentDevice(user.id);

    // Generate token and persist current active session
    const token = `mock-jwt-token-${Date.now()}`;
    if (rememberMe) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    return { success: true, user, token };
  },

  // 7. Register new student with auto-generated ID & Password
  async register(formData) {
    await delay(500);
    if (!formData.name?.trim() || !formData.phone?.trim() || !formData.email?.trim()) {
      throw new Error("Please fill in all required registration fields.");
    }

    // Generate credentials (unique User ID and secure Password)
    const credentials = generateStudentCredentials(formData);

    const courseName = formData.applyCourseName || formData.class || credentials.class || "";
    const district = formData.district || "";
    const newUser = {
      id: credentials.userId,
      password: credentials.password,
      name: credentials.name,
      email: credentials.email,
      phone: credentials.phone,
      dob: formData.dob || credentials.dob || "",
      state: formData.state || credentials.state || "",
      district,
      city: formData.city || district || "",
      address: formData.address || "",
      pincode: formData.pincode || "",
      board: formData.board || courseName,
      class: courseName,
      applyCourseName: courseName,
      applyInstituteName: formData.applyInstituteName || "",
      fatherName: formData.fatherName || "",
      motherName: formData.motherName || "",
      whatsappNo: formData.whatsappNo || "",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      joinDate: credentials.createdDate,
      streakDays: 1,
      coins: 100,
      completedLectures: 0,
      readBooks: 0,
    };

    // Save in registered users list
    saveRegisteredUser(newUser);

    // Save last credentials for display and auto-filling
    localStorage.setItem(
      LAST_CREDENTIALS_KEY,
      JSON.stringify({
        userId: credentials.userId,
        password: credentials.password,
        name: credentials.name,
        email: credentials.email,
      })
    );

    // Update active user in local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));

    return {
      success: true,
      credentials: {
        userId: credentials.userId,
        password: credentials.password,
        name: credentials.name,
        email: credentials.email,
      },
      user: newUser,
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
    const current = (await this.getCurrentUser()) || mockStudentUser;
    const updated = { ...current, ...profileData };
    saveRegisteredUser(updated);
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
      message: `Password reset instructions and OTP have been sent to your registered contact.`,
    };
  },

  async resetPassword(otp, newPassword) {
    await delay(500);
    if (!otp || !newPassword) {
      throw new Error("Please provide OTP and a new password.");
    }
    return {
      success: true,
      message: "Password has been updated successfully. You can now login.",
    };
  },

  async changePassword(currentPassword, newPassword) {
    await delay(500);
    if (!currentPassword || !newPassword) {
      throw new Error("Please enter both current and new passwords.");
    }
    return {
      success: true,
      message: "Password changed successfully.",
    };
  },

  async logout() {
    await delay(200);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    return { success: true };
  },
};
