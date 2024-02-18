const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const authController = require("../controllers/auth");
const User = require("../models/user");

// POST /auth/signup
router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value, { req }) => {
        User.findOne({ email: value }).then((user) => {
          if (user) {
            throw new Error("Email already exists");
          }
        });
      }),

    body("password")
      .trim()
      .isLength({ min: 4 })
      .withMessage("Password must be atleast 4 characters long"),

    body("name").trim().not().isEmpty().withMessage("Name is required"),
  ],
  authController.signup
);

module.exports = router;