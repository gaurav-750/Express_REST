const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const { v4: uuid4 } = require("uuid");
const { graphqlHTTP } = require("express-graphql");

const path = require("path");

//env variables
require("dotenv").config();

//database
require("./configs/database");

const app = express();

app.use(cors());

//body parser middleware
app.use(bodyParser.json());

//* multer setup
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },

  filename: (req, file, cb) => {
    cb(null, uuid4() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);

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

app.use(
  "/graphql",
  graphqlHTTP({
    schema: require("./graphql/schema"),
    rootValue: require("./graphql/resolvers"),
    graphiql: true,

    customFormatErrorFn(err) {
      console.log("Inside formatError:", err.originalError);
      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;
      const message = err.originalError.message || "An error occurred!";
      const statusCode = err.originalError.statusCode || 500;

      return {
        status: statusCode,
        message: message,
        data: data,
      };
    },
  })
);

//! error handling middleware
app.use((error, req, res, next) => {
  console.log("Inside error handling middleware");

  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;

  res.status(status).json({
    message: message,
    data: data,
  });
});

const server = app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
