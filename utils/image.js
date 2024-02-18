const fs = require("fs");
const path = require("path");

const removeImage = (imagePath) => {
  imagePath = path.join(__dirname, "..", imagePath);

  fs.unlink(imagePath, (err) => {
    if (err) {
      console.log("[utils/image.js] err:", err);
    }
  });
};

module.exports = { removeImage };
