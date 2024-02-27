const User = require("../models/user");
const Post = require("../models/post");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const validator = require("validator");
const { removeImage } = require("../utils/image");

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

  getPosts: async (args, req) => {
    const page = args.page || 1;
    const PER_PAGE = 2;

    // if (!req.isAuth) {
    //   const error = new Error("Not Authenticated.");
    //   error.statusCode = 401;
    //   throw error;
    // }

    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * PER_PAGE)
      .limit(PER_PAGE)
      .populate("creator");

    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },

  getPost: async (args, req) => {
    const { postId } = args;
    console.log("postId:", postId);

    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No Post Found!");
      error.statusCode = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },

  updatePost: async (args, req) => {
    const { postId, postInput } = args;
    const { title, content, imageUrl } = postInput;

    //check if the user is authenticated
    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No Post Found!");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not Authorized!");
      error.statusCode = 403;
      throw error;
    }

    //! Validation
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

    //now we can update the post
    post.title = title;
    post.content = content;
    if (imageUrl !== "undefined") {
      post.imageUrl = imageUrl;
    }

    const updatedPost = await post.save();

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },

  deletePost: async (args, req) => {
    const { postId } = args;

    if (!req.isAuth) {
      const error = new Error("Not Authenticated.");
      error.statusCode = 401;
      throw error;
    }

    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("No Post Found!");
      error.statusCode = 404;
      throw error;
    }

    //also check if the user is authorized to delete the post
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Not Authorized!");
      error.statusCode = 403;
      throw error;
    }

    //remove the image from the server
    removeImage(post.imageUrl);

    await Post.findByIdAndDelete(postId);

    //delete the post from the user's posts
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    return true;
  },
};
