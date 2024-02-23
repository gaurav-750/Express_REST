const { validationResult } = require("express-validator");
const Post = require("../models/post");

const { removeImage } = require("../utils/image");
const User = require("../models/user");

let io = require("../socket");

const ITEMS_PER_PAGE = 2;

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 }) //sort in descending order
      .skip((currentPage - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    return res.status(200).json({
      message: "Fetched posts successfully",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (error) {
    console.log("[controllers/feed.js/getPosts] error:", error);
    next(error);
  }
};

exports.createPost = async (req, res, next) => {
  console.log("[controllers/feed.js/createPost] req.body:", req.body);
  const { title, content } = req.body;

  console.log("[controllers/feed.js/createPost] req.file:", req.file);
  const image = req.file;

  const errors = validationResult(req); //extracts the validation errors from a request and makes them available in a Result object.

  if (!errors.isEmpty()) {
    //that means there are errors
    console.log("[controllers/feed.js/createPost] errors:", errors.array());

    const err = new Error("Validation failed, entered data is incorrect");
    err.statusCode = 422;
    throw err; //this will be caught by the error handling middleware, here we dont use nexct(err)
  }

  if (!image) {
    //if image is not present
    const err = new Error("Invalid Image");
    err.statusCode = 422;
    throw err;
  }

  //! windows path fix
  const imageUrl = image.path.replace("\\", "/");

  try {
    //create and add post to DB
    const post = await Post.create({
      title: title,
      content: content,
      imageUrl: imageUrl,
      creator: req.userId, //* we get this 'userId' from is-auth middleware
    });
    console.log("[controllers/feed.js/createPost] created post:", post);

    const user = await User.findById(req.userId);

    user.posts.push(post);
    await user.save();

    //* now we'll tell all connected clients about the new post, hence their feed will be updated automatically
    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });

    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: {
        _id: user._id,
        name: user.name,
      },
    });
  } catch (error) {
    console.log("[controllers/feed.js/createPost] error:", error);
    next(error);
  }
};

exports.getPost = async (req, res, next) => {
  console.log("[controllers/feed.js/getPost] req.params:", req.params);
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const err = new Error("Could not find post");
      err.statusCode = 404;
      throw err;
    }

    res.status(200).json({
      message: "Post fetched successfully",
      post: post,
    });
  } catch (error) {
    console.log("[controllers/feed.js/getPost] err:", error);
    next(error);
  }
};

exports.editPost = async (req, res, next) => {
  console.log("[controllers/feed.js/editPost] req.body:", req.body);
  const { title, content } = req.body;
  let imageUrl = req.body.image;

  const { postId } = req.params;

  console.log("[controllers/feed.js/editPost] req.file:", req.file);
  let image = req.file;

  if (image) {
    //that means new image is uploaded
    //! windows path fix
    imageUrl = image.path.replace("\\", "/");
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("[controllers/feed.js/editPost] errors:", errors.array());

    const err = new Error("Validation failed, entered data is incorrect");
    err.statusCode = 422;
    throw err;
  }

  try {
    const post = await Post.findById(postId).populate("creator");
    if (!post) {
      const err = new Error("Could not find post");
      err.statusCode = 404;
      throw err;
    }

    //check if the user is the creator of the post, then only he can edit the post
    if (post.creator._id.toString() !== req.userId.toString()) {
      const err = new Error("You are not authorized to edit this post!");
      err.statusCode = 403;
      throw err;
    }

    if (imageUrl !== post.imageUrl) {
      //that means new image is uploaded
      removeImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();

    io.getIO().emit("posts", {
      action: "update",
      post: result,
    });

    console.log("[controllers/feed.js/editPost] post:", result);
    res.status(200).json({
      message: "Post updated successfully",
      post: post,
    });
  } catch (error) {
    console.log("[controllers/feed.js/editPost] err:", error);
    next(error);
  }
};

exports.deletePost = async (req, res, next) => {
  console.log("[controllers/feed.js/deletePost] req.params:", req.params);
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    //check if image to be deleted is being deleted by the creator
    if (!post) {
      const err = new Error("Could not find post");
      err.statusCode = 404;
      throw err;
    }

    if (post.creator.toString() !== req.userId.toString()) {
      const err = new Error("You are not authorized to delete this post!");
      err.statusCode = 403;
      throw err;
    }

    //remove the image
    removeImage(post.imageUrl);

    //delete the post
    let result = await Post.findByIdAndDelete(postId);
    console.log("[controllers/feed.js/deletePost] result:", result);

    //!remove the post from the user's posts also
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    result = await user.save();

    //! now we'll tell all connected clients about the deleted post, hence their feed will be updated automatically
    io.getIO().emit("posts", {
      action: "delete",
      post: postId,
    });

    console.log("[controllers/feed.js/deletePost] result:", result);
    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.log("[controllers/feed.js/deletePost] err:", error);
    next(error);
  }
};
