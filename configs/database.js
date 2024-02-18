const mongoose = require("mongoose");

const uri = process.env.DATABASE_URI;
mongoose.connect(uri);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

module.exports = db;
