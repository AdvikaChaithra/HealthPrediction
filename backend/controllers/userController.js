// backend/controllers/userController.js
import User from "../models/User.js";

/**
 * @route   GET /user/profile
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
 * @route   PUT /user/profile
 * @desc    Update user profile details
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { phone, address, age, sex, diet_type, smoking_history } = req.body;

    // build updates dynamically
    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (age !== undefined) updates.age = age;
    if (sex !== undefined) updates.sex = sex;
    if (diet_type !== undefined) updates.diet_type = diet_type;
    if (smoking_history !== undefined) updates.smoking_history = smoking_history;

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
    res.status(500).json({ message: err.message });
  }
};
