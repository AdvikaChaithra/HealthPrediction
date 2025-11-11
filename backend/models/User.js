// backend/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String, // optional
      trim: true,
    },
    address: {
      type: String, // optional
      trim: true,
    },
    age: {
      type: Number, // optional now
      min: 0,
    },
    sex: {
      type: String, // optional now
      enum: ["Male", "Female", "Other"],
    },
    diet_type: {
      type: String,
      enum: ["Vegetarian", "Non-Vegetarian", "Vegan", "Pescatarian", "Healthy", "Other"],
    },
    smoking_history: {
      type: String,
      enum: ["Never", "Former", "Current"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
