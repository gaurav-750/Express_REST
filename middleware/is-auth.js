const jwt = require("jsonwebtoken");

exports.isAuthenticated = (req, res, next) => {
  //get the token from the request
  //and check if it is valid

  const authHeader = req.get("Authorization");
  console.log("[middleware/is-auth.js] authHeader:", authHeader);
  if (!authHeader) {
    const err = new Error("Not authenticated");
    err.statusCode = 401;
    throw err;
  }

  const tokenFromHeader = authHeader.split(" ")[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(tokenFromHeader, "thisissecretkey");
    console.log("[middleware/is-auth.js] decodedToken:", decodedToken);
  } catch (error) {
    throw error;
  }

  req.userId = decodedToken.userId;
  next();
};
