import { PartnerCollege } from "../models/PartnerCollege.js";
import { CollegeCourse } from "../models/CollegeCourse.js";
import { AdmissionApplication } from "../models/AdmissionApplication.js";
import { readFileStore, writeFileStore, getDBStatus } from "../config/db.js";
import mongoose from "mongoose";

const generateId = () => new mongoose.Types.ObjectId().toString();

export const dataService = {
  // COLLEGES
  async getColleges(filter = {}) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await PartnerCollege.find(filter).sort({ createdAt: -1 }).lean();
    }
    const store = readFileStore();
    let list = store.colleges || [];
    if (filter.status) {
      list = list.filter((c) => c.status === filter.status);
    }
    if (filter.city) {
      list = list.filter((c) => c.city?.toLowerCase() === filter.city.toLowerCase());
    }
    return list;
  },

  async getCollegeById(id) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await PartnerCollege.findById(id).lean();
    }
    const store = readFileStore();
    return (store.colleges || []).find((c) => String(c._id) === String(id) || String(c.id) === String(id)) || null;
  },

  async createCollege(collegeData) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      const col = new PartnerCollege(collegeData);
      return await col.save();
    }
    const store = readFileStore();
    const newCol = {
      _id: generateId(),
      ...collegeData,
      status: collegeData.status || "active",
      facilities: collegeData.facilities || [],
      contactInformation: collegeData.contactInformation || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.colleges = store.colleges || [];
    store.colleges.unshift(newCol);
    writeFileStore(store);
    return newCol;
  },

  async updateCollege(id, updates) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await PartnerCollege.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const store = readFileStore();
    const index = (store.colleges || []).findIndex((c) => String(c._id) === String(id) || String(c.id) === String(id));
    if (index === -1) return null;
    const updated = {
      ...store.colleges[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.colleges[index] = updated;
    writeFileStore(store);
    return updated;
  },

  async deleteCollege(id) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      await CollegeCourse.deleteMany({ collegeId: id });
      return await PartnerCollege.findByIdAndDelete(id);
    }
    const store = readFileStore();
    store.colleges = (store.colleges || []).filter((c) => String(c._id) !== String(id) && String(c.id) !== String(id));
    store.courses = (store.courses || []).filter((crs) => String(crs.collegeId) !== String(id));
    writeFileStore(store);
    return true;
  },

  // COURSES
  async getCourses(filter = {}) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await CollegeCourse.find(filter).sort({ createdAt: -1 }).lean();
    }
    const store = readFileStore();
    let list = store.courses || [];
    if (filter.collegeId) {
      list = list.filter((c) => String(c.collegeId) === String(filter.collegeId));
    }
    if (filter.status) {
      list = list.filter((c) => c.status === filter.status);
    }
    if (filter.degreeType) {
      list = list.filter((c) => c.degreeType?.toLowerCase() === filter.degreeType.toLowerCase());
    }
    return list;
  },

  async getCourseById(id) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await CollegeCourse.findById(id).lean();
    }
    const store = readFileStore();
    return (store.courses || []).find((c) => String(c._id) === String(id) || String(c.id) === String(id)) || null;
  },

  async createCourse(courseData) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      const crs = new CollegeCourse(courseData);
      return await crs.save();
    }
    const store = readFileStore();
    const newCourse = {
      _id: generateId(),
      ...courseData,
      status: courseData.status || "active",
      admissionStatus: courseData.admissionStatus || "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.courses = store.courses || [];
    store.courses.unshift(newCourse);
    writeFileStore(store);
    return newCourse;
  },

  async updateCourse(id, updates) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await CollegeCourse.findByIdAndUpdate(id, updates, { new: true }).lean();
    }
    const store = readFileStore();
    const index = (store.courses || []).findIndex((c) => String(c._id) === String(id) || String(c.id) === String(id));
    if (index === -1) return null;
    const updated = {
      ...store.courses[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.courses[index] = updated;
    writeFileStore(store);
    return updated;
  },

  async deleteCourse(id) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await CollegeCourse.findByIdAndDelete(id);
    }
    const store = readFileStore();
    store.courses = (store.courses || []).filter((c) => String(c._id) !== String(id) && String(c.id) !== String(id));
    writeFileStore(store);
    return true;
  },

  // ADMISSION APPLICATIONS
  async getApplications(filter = {}) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await AdmissionApplication.find(filter)
        .populate("collegeId")
        .populate("courseId")
        .sort({ createdAt: -1 })
        .lean();
    }
    const store = readFileStore();
    let list = [...(store.applications || [])];
    if (filter.status && filter.status !== "All") {
      list = list.filter((a) => a.status?.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.collegeId) {
      list = list.filter((a) => String(a.collegeId) === String(filter.collegeId));
    }
    // Hydrate college & course references
    return list.map((app) => {
      const college = (store.colleges || []).find((c) => String(c._id) === String(app.collegeId) || String(c.id) === String(app.collegeId));
      const course = (store.courses || []).find((crs) => String(crs._id) === String(app.courseId) || String(crs.id) === String(app.courseId));
      return {
        ...app,
        collegeId: college || { name: "Unknown College", city: "" },
        courseId: course || { courseName: "Unknown Course", degreeType: "" },
      };
    });
  },

  async getApplicationById(id) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await AdmissionApplication.findById(id)
        .populate("collegeId")
        .populate("courseId")
        .lean();
    }
    const apps = await this.getApplications();
    return apps.find((a) => String(a._id) === String(id) || a.applicationId === id) || null;
  },

  async createApplication(applicationData) {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      const app = new AdmissionApplication(applicationData);
      return await app.save();
    }
    const store = readFileStore();
    const newApp = {
      _id: generateId(),
      ...applicationData,
      status: "New",
      adminNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.applications = store.applications || [];
    store.applications.unshift(newApp);
    writeFileStore(store);
    return newApp;
  },

  async updateApplicationStatus(id, status, note = null, author = "Admin") {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      const updateDoc = { status };
      if (note) {
        return await AdmissionApplication.findByIdAndUpdate(
          id,
          {
            $set: { status },
            $push: { adminNotes: { note, author, createdAt: new Date() } },
          },
          { new: true }
        ).populate("collegeId courseId");
      }
      return await AdmissionApplication.findByIdAndUpdate(id, updateDoc, { new: true }).populate("collegeId courseId");
    }

    const store = readFileStore();
    const index = (store.applications || []).findIndex(
      (a) => String(a._id) === String(id) || a.applicationId === id
    );
    if (index === -1) return null;

    const current = store.applications[index];
    const notes = current.adminNotes || [];
    if (note) {
      notes.push({
        _id: generateId(),
        note,
        author,
        createdAt: new Date().toISOString(),
      });
    }

    const updated = {
      ...current,
      status,
      adminNotes: notes,
      updatedAt: new Date().toISOString(),
    };
    store.applications[index] = updated;
    writeFileStore(store);
    return updated;
  },

  async addApplicationNote(id, note, author = "Admin") {
    const { isMongoConnected } = getDBStatus();
    if (isMongoConnected) {
      return await AdmissionApplication.findByIdAndUpdate(
        id,
        { $push: { adminNotes: { note, author, createdAt: new Date() } } },
        { new: true }
      ).populate("collegeId courseId");
    }
    const store = readFileStore();
    const index = (store.applications || []).findIndex(
      (a) => String(a._id) === String(id) || a.applicationId === id
    );
    if (index === -1) return null;
    const current = store.applications[index];
    const notes = current.adminNotes || [];
    notes.push({
      _id: generateId(),
      note,
      author,
      createdAt: new Date().toISOString(),
    });
    current.adminNotes = notes;
    current.updatedAt = new Date().toISOString();
    store.applications[index] = current;
    writeFileStore(store);
    return current;
  },
};
