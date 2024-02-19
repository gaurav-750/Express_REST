const express = require("express");
const { check, body } = require("express-validator");

const feedController = require("../controllers/feed");
const { isAuthenticated } = require("../middleware/is-auth");

const router = express.Router();

// GET /feed/posts
router.get("/posts", isAuthenticated, feedController.getPosts);

router.post(
  "/post",
  isAuthenticated,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost
);

router.get("/post/:postId", isAuthenticated, feedController.getPost);

//edit post
//PUT /feed/post/:postId
router.put(
  "/post/:postId",
  isAuthenticated,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.editPost
);

//delete post
router.delete("/post/:postId", isAuthenticated, feedController.deletePost);

module.exports = router;
