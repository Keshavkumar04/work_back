const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");

var cors = require("cors");
var multer = require("multer"),
  bodyParser = require("body-parser"),
  path = require("path");
var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");
var user = require("../model/user.js");
const crypto = require("crypto");
const session = require("express-session");

const SECRET_KEY = "shhhhh11111";

// Middleware to verify JWT and extract user information
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log("Authorization Header:", authHeader); // Log the Authorization header for debugging

  const token = authHeader && authHeader.split(" ")[1];
  console.log("Extracted Token:", token); // Log the extracted token for debugging

  if (token == null)
    return res
      .status(401)
      .json({ errorMessage: "No token provided", status: false });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error("JWT Verification Error:", err); // Log the error for debugging
      return res
        .status(403)
        .json({ errorMessage: "Invalid token", status: false });
    }

    req.user = user;
    next();
  });
}

// Function to check user and generate JWT token
function checkUserAndGenerateToken(data, req, res) {
  jwt.sign(
    { user: data.username, id: data._id },
    SECRET_KEY,
    { expiresIn: "1d" },
    (err, token) => {
      if (err) {
        res.status(400).json({
          status: false,
          errorMessage: err,
        });
      } else {
        console.log("Generated JWT Token:", token); // Logging the generated token
        res.json({
          message: "Login Successfully.",
          token: token,
          status: true,
        });
      }
    }
  );
}

// Login route
router.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (email && password) {
      console.log("Email:", email);
      console.log("Password:", password);

      user.findOne({ email: email }, (err, userData) => {
        // Use findOne instead of find for single user
        if (err) {
          console.error("Database Error:", err);
          return res.status(500).json({
            errorMessage: "Database error!",
            status: false,
          });
        }

        if (userData) {
          // Compare the provided password with the hashed password
          bcrypt.compare(password, userData.password, (err, isMatch) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return res.status(500).json({
                errorMessage: "Error comparing passwords!",
                status: false,
              });
            }

            if (isMatch) {
              console.log("Logged in successfully");
              checkUserAndGenerateToken(userData, req, res);
            } else {
              res.status(400).json({
                errorMessage: "Email or password is incorrect!",
                status: false,
              });
            }
          });
        } else {
          res.status(400).json({
            errorMessage: "Email or password is incorrect!",
            status: false,
          });
        }
      });
    } else {
      res.status(400).json({
        errorMessage: "Add proper parameter first!",
        status: false,
      });
    }
  } catch (e) {
    console.error("Exception:", e);
    res.status(400).json({
      errorMessage: "Something went wrong!",
      status: false,
    });
  }
});

// /me route to return current user's data
router.get("/me", authenticateToken, (req, res) => {
  user.findById(req.user.id, (err, userData) => {
    if (err) {
      return res.status(500).json({
        errorMessage: "Database error!",
        status: false,
      });
    }

    if (!userData) {
      return res.status(404).json({
        errorMessage: "User not found!",
        status: false,
      });
    }

    res.json({
      message: "User data retrieved successfully.",
      user: {
        id: userData._id,
        username: userData.username,
        email: userData.email,
        // Add other user fields as needed
      },
      status: true,
    });
  });
});

// register api
const saltRounds = 12; // Number of salt rounds for hashing
router.post("/register", (req, res) => {
  try {
    if (req.body && req.body.username && req.body.email && req.body.password) {
      user.find({ email: req.body.email }, (err, data) => {
        if (data.length == 0) {
          // Hash the password before saving it to the database
          bcrypt.hash(req.body.password, saltRounds, (err, hashedPassword) => {
            if (err) {
              res.status(500).json({
                errorMessage: "Error hashing password!",
                status: false,
              });
            } else {
              let User = new user({
                username: req.body.username,
                email: req.body.email,
                password: hashedPassword,
              });

              User.save((err, data) => {
                if (err) {
                  res.status(400).json({
                    errorMessage: err,
                    status: false,
                  });
                } else {
                  res.status(200).json({
                    status: true,
                    title: "Registered Successfully.",
                  });
                }
              });
            }
          });
        } else {
          res.status(400).json({
            errorMessage: `Email ${req.body.email} Already Exist!`,
            status: false,
          });
        }
      });
    } else {
      res.status(400).json({
        errorMessage: "Add proper parameter first!",
        status: false,
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: "Something went wrong!",
      status: false,
    });
  }
});

// FORGOT PASSWORD **********************

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        errorMessage: "Email is required!",
        status: false,
      });
    }

    const User = await user.findOne({ email });

    if (!User) {
      return res.status(400).json({
        errorMessage: "No account with that email address exists.",
        status: false,
      });
    }

    const token = crypto.randomBytes(20).toString("hex");
    User.resetPasswordToken = token;
    User.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await User.save();

    const resetURL = `${process.env.FRONTEND_URL}/resetPassword/${token}`;
    console.log(resetURL);
    console.log(email);

    //  resetURL via email
    return res.status(200).json({
      status: true,
      message: "Password reset link has been sent to your email.",
      resetURL: resetURL,
    });
  } catch (e) {
    console.error("Exception:", e);
    return res.status(500).json({
      errorMessage: "Internal server error!",
      status: false,
    });
  }
});

// reset-password ***********************
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    const User = await user.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!User) {
      return res.status(400).json({
        errorMessage: "Password reset token is invalid or has expired.",
        status: false,
      });
    }

    // Hash the new password before saving it
    bcrypt.hash(password, saltRounds, async (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({
          errorMessage: "Error hashing password!",
          status: false,
        });
      }

      User.password = hashedPassword;
      User.resetPasswordToken = undefined;
      User.resetPasswordExpires = undefined;

      await User.save();

      return res.status(200).json({
        status: true,
        message: "Password has been reset successfully.",
      });
    });
  } catch (e) {
    console.error("Exception:", e);
    return res.status(500).json({
      errorMessage: "Internal server error!",
      status: false,
    });
  }
});

module.exports = router;
