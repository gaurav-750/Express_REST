const { validationResult } = require("express-validator");
const Post = require("../models/post");

const { removeImage } = require("../utils/image");
const User = require("../models/user");

const ITEMS_PER_PAGE = 2;

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;

  let totalItems;
  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;

      return Post.find()
        .skip((currentPage - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((posts) => {
      return res.status(200).json({
        message: "Fetched posts successfully",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js/getPosts] err:", err);
      next(err);
    });
};

exports.createPost = (req, res, next) => {
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

  let createdPost;
  //create and add post to DB
  Post.create({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId, //* we get this 'userId' from is-auth middleware
  })
    .then((post) => {
      console.log("[controllers/feed.js/createPost] created post:", post);
      createdPost = post;

      //add this post to the user's posts
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.push(createdPost);
      return user.save();
    })
    .then((user) => {
      res.status(201).json({
        message: "Post created successfully!",
        post: createdPost,
        creator: {
          _id: user._id,
          name: user.name,
        },
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js/createPost] err:", err);

      //here we use next(err) instead of throw err because we are inside a promise
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  console.log("[controllers/feed.js/getPost] req.params:", req.params);
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const err = new Error("Could not find post");
        err.statusCode = 404;
        throw err;
      }

      res.status(200).json({
        message: "Post fetched successfully",
        post: post,
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js/getPost] err:", err);
      next(err);
    });
};

exports.editPost = (req, res, next) => {
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

  //Now we can update Post
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const err = new Error("Could not find post");
        err.statusCode = 404;
        throw err;
      }

      if (imageUrl !== post.imageUrl) {
        //that means new image is uploaded
        removeImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      console.log("[controllers/feed.js/editPost] result:", result);
      res.status(200).json({
        message: "Post updated successfully",
        post: result,
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js/editPost] err:", err);
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  console.log("[controllers/feed.js/deletePost] req.params:", req.params);
  const { postId } = req.params;

  Post.findById(postId)
    .then((post) => {
      //check if image to be deleted is being deleted by the creator
      if (!post) {
        const err = new Error("Could not find post");
        err.statusCode = 404;
        throw err;
      }

      //remove the image
      removeImage(post.imageUrl);

      return Post.findByIdAndDelete(postId);
    })
    .then((result) => {
      console.log("[controllers/feed.js/deletePost] result:", result);
      res.status(200).json({
        message: "Post deleted successfully",
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js/deletePost] err:", err);
      next(err);
    });
};
