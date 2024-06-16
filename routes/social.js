const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const SECRET_KEY = "shhhhh11111"; // Ensure this matches your secret key

const generateToken = (user) => {
  return jwt.sign({ user: user.username, id: user._id }, SECRET_KEY, {
    expiresIn: "1d",
  });
};

// Facebook Login
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  (req, res) => {
    if (!req.user) {
      console.error("User not found after Facebook login");
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
    const token = generateToken(req.user);
    console.log("Generated JWT Token:", token); // Logging the generated token
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// Google Login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    if (!req.user) {
      console.error("User not found after Google login");
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
    const token = generateToken(req.user);
    console.log("Generated JWT Token:", token); // Logging the generated token
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// GitHub Login
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    if (!req.user) {
      console.error("User not found after GitHub login");
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
    const token = generateToken(req.user);
    console.log("Generated JWT Token:", token); // Logging the generated token
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}`);
  }
);

module.exports = router;
