const { Router } = require("express");

const router = Router();

const authController = require("../controllers/authController");

router.post("/login", authController.handleLogin);
router.post("/register", authController.handleRegister);
router.post("/token", authController.handleGenerateAccessToken);
router.post("/verify", authController.handleGenerateVerificationEmail);
router.put("/verify/:token", authController.handleUpdateVerificationStatus);
router.delete("/logout", authController.handleLogout);

module.exports = router;
