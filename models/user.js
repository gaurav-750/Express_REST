const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    //* reference to Post
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true, //? mongoose will automatically add 'createdAt' and 'updatedAt' fields to the schema
  }
);

//create Post model
const User = mongoose.model("User", UserSchema);
module.exports = User;
