import mongoose from "mongoose";

const adminNoteSchema = new mongoose.Schema(
  {
    note: { type: String, required: true },
    author: { type: String, default: "Admin" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const admissionApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      default: "",
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerCollege",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollegeCourse",
      required: true,
      index: true,
    },
    studentDetails: {
      fullName: { type: String, required: [true, "Full name is required"] },
      mobileNumber: { type: String, required: [true, "Mobile number is required"] },
      email: { type: String, required: [true, "Email is required"] },
      dob: { type: String, default: "" },
      city: { type: String, default: "" },
      educationalQualification: { type: String, default: "" },
      passingYear: { type: String, default: "" },
      additionalInfo: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "In Process", "Approved", "Rejected"],
      default: "New",
      index: true,
    },
    adminNotes: [adminNoteSchema],
  },
  {
    timestamps: true,
  }
);

export const AdmissionApplication = mongoose.model("AdmissionApplication", admissionApplicationSchema);
