const { validationResult } = require("express-validator");
const Post = require("../models/post");

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: "1",
        title: "First Post",
        content: "This is the first post!",
        imageUrl: "images/duck.jpg",
        creator: {
          name: "Gaurav",
        },
        createdAt: new Date(),
      },
    ],
  });
};

exports.createPost = (req, res, next) => {
  console.log("[controllers/feed.js] req.body:", req.body);
  const { title, content } = req.body;

  const errors = validationResult(req); //extracts the validation errors from a request and makes them available in a Result object.

  if (!errors.isEmpty()) {
    //that means there are errors
    console.log("[controllers/feed.js] errors:", errors.array());

    return res.status(422).json({
      message: "Validation failed, entered data is incorrect",
      errors: errors.array(),
    });
  }

  //create and add post to DB
  Post.create({
    title: title,
    content: content,
    imageUrl: "images/duck.jpg",
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
      res.status(500).json({
        message: "Creating the post failed!",
      });
    });
};
