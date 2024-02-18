const User = require("../models/user");
const bcrypt = require("bcrypt");

const { validationResult } = require("express-validator");

exports.signup = (req, res, next) => {
  console.log("[controllers/auth.js] req.body:", req.body);
  const { email, name, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("[controllers/auth.js] errors:", errors.array());

    const err = new Error("Validation failed");
    err.statusCode = 422;
    err.data = errors.array();
    throw err;
  }

  //create new User
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      return User.create({
        email,
        name,
        password: hashedPassword,
      });
    })
    .then((user) => {
      console.log("[controllers/auth.js] user:", user);

      res.status(201).json({
        message: "User created successfully",
        userId: user._id,
      });
    })
    .catch((err) => {
      console.log("[controllers/auth.js] err:", err);

      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
