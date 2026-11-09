// backend/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  address: user.address || "",
  age: user.age ?? null,
  sex: user.sex || "",
  diet_type: user.diet_type || "",
  smoking_history: user.smoking_history || "",
});

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (returns a token so the client is signed in)
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    const phone = (req.body?.phone || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, phone, email, password: hashed });

    return res.status(201).json({
      message: "User registered successfully",
      token: signToken(newUser),
      user: publicUser(newUser),
    });
  } catch (err) {
    // Race on the unique email index
    if (err.code === 11000) {
      return res.status(400).json({ message: "User already exists with this email" });
    }
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Log in user and return token
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid password" });

    res.json({ message: "Login successful", token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
