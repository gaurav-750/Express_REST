const User = require("../models/user");
const Post = require("../models/post");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      error.data = errors; //adding the errors to the error object
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

  login: async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    console.log("user:", user);

    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 401;
      throw error;
    }

    //user is there, now check the password
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is incorrect!");
      error.statusCode = 401;
      throw error;
    }

    //if we reach here, the user is authenticated
    //generate token
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      token: token,
      userId: user._id.toString(),
    };
  },

  createPost: async function ({ postInput, req }) {
    const { title, content, imageUrl } = postInput;

    const errors = [];
    if (validator.isEmpty(title) || !validator.isLength(title, { min: 4 })) {
      errors.push({ message: "Title must be atleast 4 chars!" });
    }

    if (
      validator.isEmpty(content) ||
      !validator.isLength(content, { min: 4 })
    ) {
      errors.push({ message: "Content must be atleast 4 chars!" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input!");
      error.data = errors;
      error.statusCode = 422;
      throw error;
    }

    const post = await Post.create({
      title: title,
      content: content,
      imageUrl: imageUrl,
    });

    //add post to user's posts

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
};
