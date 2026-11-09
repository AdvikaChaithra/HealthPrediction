// backend/middleware/verifyToken.js
import jwt from "jsonwebtoken";

// Verifies "Authorization: Bearer <token>" and attaches req.userId.
const verifyToken = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
