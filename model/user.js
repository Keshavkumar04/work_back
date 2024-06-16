// var mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: [true, "Username cannot be blank"],
//   },
//   password: {
//     type: String,
//     required: function () {
//       return !this.googleId && !this.githubId && !this.facebookId;
//     },
//   },
//   email: {
//     type: String,
//     required: [true, "Email cannot be blank"],
//     unique: true,
//   },
//   googleId: String,
//   githubId: String,
//   facebookId: String,
//   resetPasswordToken: String,
//   resetPasswordExpires: Date,
// });

// user = mongoose.model("user", userSchema);

// module.exports = user;

const mongoose = require("mongoose");
const Joi = require("joi");

// Define JOI schema for user validation
const userJoiSchema = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "Username cannot be blank",
  }),
  password: Joi.string()
    .min(6)
    .when("noSocialLogin", { is: false, then: Joi.required() })
    .messages({
      "string.min": "Password must be at least {#limit} characters long",
      "any.required": "Password cannot be blank",
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email cannot be blank",
  }),
  googleId: Joi.string(),
  githubId: Joi.string(),
  facebookId: Joi.string(),
  resetPasswordToken: Joi.string(),
  resetPasswordExpires: Joi.date(),
});

// Define Mongoose schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  googleId: String,
  githubId: String,
  facebookId: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Apply Joi validation to Mongoose schema paths
userSchema.path("username").validate(async function (value) {
  const existingUser = await this.constructor.findOne({ username: value });
  if (existingUser) {
    throw new Error(`Username '${value}' already exists`);
  }
}, "Username already exists");

userSchema.path("email").validate(async function (value) {
  const existingUser = await this.constructor.findOne({ email: value });
  if (existingUser) {
    throw new Error(`Email '${value}' already exists`);
  }
}, "Email already exists");

// Compile the Mongoose model
const user = mongoose.model("User", userSchema);

module.exports = user;
