import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/auth.js";
import uploadFile from "../middleware/multer.js";
const router = express.Router();
router.post("/register", uploadFile, registerUser);
router.post("/login", loginUser);
router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);
export default router;
