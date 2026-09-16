import mongoose from "mongoose";

const collegeCourseSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PartnerCollege",
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    degreeType: {
      type: String,
      default: "Undergraduate", // Undergraduate, Postgraduate, Diploma, Doctorate
      index: true,
    },
    duration: {
      type: String,
      default: "3 Years",
    },
    eligibility: {
      type: String,
      default: "10+2 with minimum 50% aggregate",
    },
    fee: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    availableSeats: {
      type: Number,
      default: 60,
    },
    admissionStatus: {
      type: String,
      enum: ["Open", "Closed", "Upcoming"],
      default: "Open",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CollegeCourse = mongoose.model("CollegeCourse", collegeCourseSchema);
