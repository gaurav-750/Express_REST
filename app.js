const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

//database
require("./configs/database");

const feedRoutes = require("./routes/feed");

const app = express();

//body parser middleware
app.use(bodyParser.json());

//cors middleware
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, PATCH, DELETE"
//   );

//   next();
// });

app.use(cors());

app.use("/feed", feedRoutes);

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
