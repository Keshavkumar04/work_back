var express = require("express");
var app = express();
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var cors = require("cors");
var multer = require("multer"),
  bodyParser = require("body-parser"),
  path = require("path");
var mongoose = require("mongoose");
var fs = require("fs");
var user = require("./model/user.js");
const crypto = require("crypto");
const session = require("express-session");

// routes
const authRoutes = require("./routes/auth.js");
const socialRoutes = require("./routes/social.js");

// credentiols login
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
require("dotenv").config();
require("./passportConfig");

mongoose
  .connect(
    "mongodb+srv://pikachuzombie2:06Ax9gKfdu4gtNTE@therock.rqgcwza.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

app.use(express.json());
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ************************************

app.use(cors());
app.use(express.static("uploads"));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: false,
  })
);

app.use("/", (req, res, next) => {
  try {
    if (
      req.path == "/login" ||
      req.path == "/register" ||
      req.path == "/" ||
      req.path == "/forgot-password" ||
      req.path == "/reset-password" ||
      req.path == "/me" ||
      req.path == "auth" ||
      req.path.startsWith("/auth/")
    ) {
      next();
    } else {
      /* decode jwt token if authorized*/
      jwt.verify(req.headers.token, "shhhhh11111", function (err, decoded) {
        if (decoded && decoded.user) {
          req.user = decoded;
          next();
        } else {
          return res.status(401).json({
            errorMessage: "User unauthorized!",
            status: false,
          });
        }
      });
    }
  } catch (e) {
    res.status(400).json({
      errorMessage: "Something went wrong!",
      status: false,
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: true,
    title: "Apis",
  });
});

// // credentioals login

app.use("/auth", socialRoutes);
app.use("/", authRoutes);

app.listen(2000, () => {
  console.log("Server is Runing On port 2000");
});
