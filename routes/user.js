const express = require("express");
const userRouter = express.Router();
const {
  createUser,
  loginUser,
  logoutUser,
  getUser,
  updateMyProfile,
  updatePassword,
  deleteUser,
} = require("../controller/user");
const isLoggedIn = require("../middleware/isLoggedIn");
const upload = require("../middleware/multer");

userRouter.route("/createUser").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  createUser
);
userRouter.route("/loginUser").post(loginUser);
userRouter.route("/logoutUser").get(isLoggedIn, logoutUser);
userRouter.route("/getUser").get(isLoggedIn, getUser);
userRouter.route("/updatePassword").put(isLoggedIn, updatePassword);
userRouter.route("/deleteUser").delete(isLoggedIn,deleteUser );
userRouter.route("/updateUser").put(
  isLoggedIn,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "resume", maxCount: 1 },
  ]),
  updateMyProfile
);

module.exports = userRouter;
