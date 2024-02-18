const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const path = require("path");

//env variables
require("dotenv").config();

//database
require("./configs/database");

const feedRoutes = require("./routes/feed");

const app = express();

app.use(cors());

//body parser middleware
app.use(bodyParser.json());

//
app.use("/images", express.static(path.join(__dirname, "images")));

//cors middleware
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE"
//   );

//   next();
// });

app.use("/feed", feedRoutes);

//! error handling middleware
app.use((error, req, res, next) => {
  console.log("Inside error handling middleware");

  const status = error.statusCode || 500;
  const message = error.message;

  res.status(status).json({
    message: message,
  });
});

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
