import express from "express";
import authMiddleware from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";

import {
  createClient,
  getActiveClientsForSignup,
  getAllClients,
  getClientById,
  updateClient,
  updateClientStatus,
  toggleClientActiveStatus,
} from "../controllers/clientController.js";
import { upload } from '../utils/upload.js';

const router = express.Router();

// ========================================
// Create Client
// ========================================
router.post(
  "/",
  authMiddleware,
  authorize("super_admin"),
  upload.single('logo'),
  createClient
);

// ========================================
// Get All Clients
// ========================================
router.get(
  "/",
  authMiddleware,
  authorize("super_admin", "client_admin"),
  getAllClients
);

// ========================================
// Public active clients for farmer signup
// ========================================
router.get(
  "/public/active",
  getActiveClientsForSignup
);

// ========================================
// Get Client By ID
// ========================================
router.put(
  "/:id",
  authMiddleware,
  authorize("super_admin"),
  upload.single('logo'),
  updateClient
);

router.get(
  "/:id",
  authMiddleware,
  authorize("super_admin", "client_admin", "farmer"),
  getClientById
);

export default router;