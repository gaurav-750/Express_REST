const mongoose = require("mongoose");

const uri =
  "mongodb+srv://somanigaurav:6owytrHAY2W2K1Zr@social.d9s3efh.mongodb.net/shop?retryWrites=true&w=majority";

mongoose.connect(uri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = db;
