const User = require("../models/user");
const bcrypt = require("bcrypt");

module.exports = {
  createUser: async function (args, req) {
    const { email, name, password } = args.userInput;

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

  hello: function () {
    return "Hello World!";
  },

  getUsers: async function () {
    const users = await User.find();
    return users.map((user) => {
      return { ...user._doc, _id: user._id.toString() };
    });
  },

  getPosts: async function () {
    return [
      {
        _id: "1",
        title: "First Post",
        content: "This is the content of the first post",
      },
    ];
  },
};
