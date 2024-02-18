const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    creator: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true, //? mongoose will automatically add 'createdAt' and 'updatedAt' fields to the schema
  }
);

//create Post model
const Post = mongoose.model("Post", PostSchema);
module.exports = Post;
