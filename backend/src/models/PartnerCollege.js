import mongoose from "mongoose";

const partnerCollegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "College name is required"],
      trim: true,
    },
    logo: {
      type: String,
      default: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&auto=format&fit=crop&q=80",
    },
    banner: {
      type: String,
      default: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80",
    },
    description: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "India",
    },
    location: {
      type: String,
      default: "",
    },
    collegeType: {
      type: String,
      default: "Private University",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    about: {
      type: String,
      default: "",
    },
    facilities: {
      type: [String],
      default: [],
    },
    admissionInformation: {
      type: String,
      default: "",
    },
    contactInformation: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

export const PartnerCollege = mongoose.model("PartnerCollege", partnerCollegeSchema);
