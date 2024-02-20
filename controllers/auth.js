const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { validationResult } = require("express-validator");

exports.signup = async (req, res, next) => {
  console.log("[controllers/auth.js/signup] req.body:", req.body);
  const { email, name, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("[controllers/auth.js/signup] errors:", errors.array());

    const err = new Error("Validation failed");
    err.statusCode = 422;
    err.data = errors.array();
    throw err;
  }

  try {
    //create new User
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      name,
      password: hashedPassword,
    });
    console.log("[controllers/auth.js/signup] user:", user);

    res.status(201).json({
      message: "User created successfully",
      userId: user._id,
    });
  } catch (err) {
    console.log("[controllers/auth.js/signup] err:", err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  console.log("[controllers/auth.js/login] req.body:", req.body);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const err = new Error("A user with this email could not be found");
      err.statusCode = 404;
      throw err;
    }

    //means user is there, Now compare the password
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const err = new Error("Wrong password");
      err.statusCode = 401;
      throw err;
    }

    //means password is correct, now send token
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "thisissecretkey",
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    console.log("[controllers/auth.js/login] err:", err);
    next(err);
  }
};

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const err = new Error("User not found!");
        err.statusCode = 404;
        throw err;
      }

      return res.status(200).json({
        status: user.status,
      });
    })
    .catch((err) => {
      console.log("[controllers/auth.js/getUserStatus] err:", err);
      next(err);
    });
};

exports.updateUserStatus = (req, res, next) => {
  console.log("[controllers/auth.js/updateUserStatus] req.body:", req.body);
  const { status } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(
      "[controllers/auth.js/updateUserStatus] errors:",
      errors.array()
    );
    const err = new Error("Validation failed, entered data is incorrect");
    err.statusCode = 422;
    throw err;
  }

  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const err = new Error("User not found!");
        err.statusCode = 404;
        throw err;
      }

      user.status = status;
      return user.save();
    })
    .then((user) => {
      return res.status(200).json({
        message: "User status updated successfully",
      });
    })
    .catch((err) => {
      console.log("[controllers/auth.js/updateUserStatus] err:", err);
      next(err);
    });
};
