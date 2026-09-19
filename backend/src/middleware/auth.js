import jwt from "jsonwebtoken";
import { getCurrentUser } from "../utils/getCurrentUser.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Get Authorization Header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    // Extract Token
    const token = authHeader.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get current user membership
    const currentUser = await getCurrentUser(decoded.userId);

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User is not assigned to any active client.",
      });
    }

    // Store user information
    req.userId = currentUser.userId;
    req.clientId = currentUser.clientId;

    // Global system role
    req.userRole = currentUser.role;

    // Role inside the client
    req.clientRole = currentUser.clientRole;

    req.client = currentUser.client;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
};

export default authMiddleware;