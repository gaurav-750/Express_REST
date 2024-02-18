const User = require("../models/user");

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
};
