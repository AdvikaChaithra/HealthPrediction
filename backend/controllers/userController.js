// backend/controllers/userController.js
import User from "../models/User.js";

const EDITABLE_FIELDS = ["phone", "address", "age", "sex", "diet_type", "smoking_history"];

/**
 * @route   GET /api/user/profile
 * @desc    Get logged-in user's profile
 * @access  Private
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error in getProfile:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile details. Sending "" or null clears a field.
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const $set = {};
    const $unset = {};

    for (const field of EDITABLE_FIELDS) {
      if (!(field in (req.body || {}))) continue;
      const value = req.body[field];
      if (value === "" || value === null) {
        $unset[field] = "";
      } else if (field === "age") {
        const age = Number(value);
        if (!Number.isFinite(age)) return res.status(400).json({ message: "Age must be a number" });
        $set.age = age;
      } else {
        $set[field] = typeof value === "string" ? value.trim() : value;
      }
    }

    const update = {};
    if (Object.keys($set).length) update.$set = $set;
    if (Object.keys($unset).length) update.$unset = $unset;

    const updatedUser = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: err.message });
    }
    console.error("Error in updateProfile:", err);
    res.status(500).json({ message: err.message });
  }
};
