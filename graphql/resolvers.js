const User = require("../models/user");
const bcrypt = require("bcrypt");

const validator = require("validator");

module.exports = {
  createUser: async function (args, req) {
    const { email, name, password } = args.userInput;

    //! Validation
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({
        message: "Email is invalid!",
      });
    }

    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      errors.push({
        message: "Password too short!",
      });
    }

    //if there are errors
    if (errors.length > 0) {
      const error = new Error("Invalid input!");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error("User already exists!");
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const createdUser = await User.create({
      email: email,
      name: name,
      password: hashedPassword,
    });

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },

  getUsers: async function () {
    const users = await User.find();
    return users.map((user) => {
      return { ...user._doc, _id: user._id.toString() };
    });
  },

  getPosts: async function () {
    return [
      {
        _id: "1",
        title: "First Post",
        content: "This is the content of the first post",
      },
    ];
  },
};
