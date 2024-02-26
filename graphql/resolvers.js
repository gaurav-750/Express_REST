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

  createPost: async function (args, req) {
    const { title, content, imageUrl } = args.postInput;
    // const { req } = context;

    console.log("req.isAuth:", req.isAuth);
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.statusCode = 401;
      throw error;
    }

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

    //also get the user
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid user!");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.create({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: user,
    });

    //add post to user's posts
    user.posts.push(post);
    await user.save();

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
};
