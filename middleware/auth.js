const jwt = require("jsonwebtoken");

exports.isAuthenticated = (req, res, next) => {
  //get the token from the request
  //and check if it is valid
  console.log("Inside isAuthenticated middleware");

  const authHeader = req.get("Authorization");
  // console.log("[middleware/is-auth.js] authHeader:", authHeader);
  if (!authHeader) {
    req.isAuth = false;
    return next(); //return next to continue to the next middleware
  }

  const tokenFromHeader = authHeader.split(" ")[1];
  let decodedToken;

  try {
    decodedToken = jwt.verify(tokenFromHeader, process.env.JWT_SECRET);
    // console.log("[middleware/is-auth.js] decodedToken:", decodedToken);
  } catch (error) {
    req.isAuth = false;
    return next();
  }

  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }

  req.userId = decodedToken.userId;
  req.isAuth = true; //* set the isAuth property to true
  next();
};
