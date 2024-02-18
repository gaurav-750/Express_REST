const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      return res.status(200).json({
        message: "Fetched posts successfully",
        posts: posts,
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js] err:", err);

      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  console.log("[controllers/feed.js] req.body:", req.body);
  const { title, content } = req.body;

  const errors = validationResult(req); //extracts the validation errors from a request and makes them available in a Result object.

  if (!errors.isEmpty()) {
    //that means there are errors
    console.log("[controllers/feed.js] errors:", errors.array());

    const err = new Error("Validation failed, entered data is incorrect");
    err.statusCode = 422;
    throw err; //this will be caught by the error handling middleware, here we dont use nexct(err)
  }

  //create and add post to DB
  Post.create({
    title: title,
    content: content,
    imageUrl: "images/book-01.jpg",
    creator: { name: "Gaurav" },
  })
    .then((result) => {
      console.log("[controllers/feed.js] result:", result);

      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      console.log("[controllers/feed.js] err:", err);

      if (!err.statusCode) {
        err.statusCode = 500;
      }

      //here we use next(err) instead of throw err because we are inside a promise
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  console.log("[controllers/feed.js] req.params:", req.params);
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
      console.log("[controllers/feed.js] err:", err);

      if (!err.statusCode) {
        err.statusCode = 500;
      }

      next(err);
    });
};
