const ErrorHandler = require("../utils/ErrorHandler");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  fileUploadOnCloudinary,
  fileDestroyOnCloudinary,
} = require("../utils/cloudinary");

const createUser = async (req, res, next) => {
  try {
    const {
      role,
      fullName,
      email,
      password,
      address,
      firstNiche,
      secondNiche,
      thirdNiche,
      coverLetter,
    } = req.body;
    if (!role || !fullName || !email || !password) {
      return next(
        new ErrorHandler(
          "Role,Email,fullName & Password fields are required",
          400
        )
      );
    }
    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      return next(new ErrorHandler("User Already Exist", 400));
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const userData = {
      fullName,
      email,
      address,
      password: hashPassword,
      niches: {
        firstNiche,
        secondNiche,
        thirdNiche,
      },
      role,
      coverLetter,
    };
    if (role === "Job Seeker" && (!firstNiche || !secondNiche || !thirdNiche)) {
      return next(new ErrorHandler("please provide your prefered niches", 400));
    }

    if (
      req.files &&
      req.files.avatar &&
      req.files.avatar[0].fieldname === "avatar"
    ) {
      const avatar = await fileUploadOnCloudinary(req.files.avatar[0].path);
      userData.avatar = { public_id: avatar.public_id, url: avatar.url };
    }

    if (
      req.files &&
      req.files.resume &&
      req.files.resume[0].fieldname === "resume"
    ) {
      const resume = await fileUploadOnCloudinary(req.files.resume[0].path);
      userData.resume = { public_id: resume.public_id, url: resume.url };
    }

    const user = await User.create(userData);

    const token = await jwt.sign(
      { _id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    });

    return res.status(200).json({
      success: true,
      message: "Your account is successfully created",
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
};

const logoutUser = async (req, res, next) => {
  res.clearCookie("token", {
    httpOnly: true,
  });
  return res.status(200).json({
    success: true,
    message: "You are successfully logout...",
  });
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return next(new ErrorHandler("All Fields Required..."));
    }
    console.log(role, email, password);
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorHandler("Email or Password Is Incorrect", 400));
    }
    const passwordChecking = await bcrypt.compare(password, user.password);
    if (!passwordChecking) {
      return next(new ErrorHandler("Email or Password Is Incorrect", 400));
    }
    if (role != user.role) {
      return next(new ErrorHandler("Role is incorrect"));
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.JSON_WEB_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    });
    return res.status(200).json({
      sccess: true,
      message: "You are successfully loggedin",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

const getUser = async (req, res, next) => {
  const user = req.user;
  return res.status(200).json({
    success: true,
    message: "Here are your details",
    user,
  });
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { _id } = req.user;
    const newUserData = {
      fullName: req.body.fullName,
      email: req.body.email,
      address: req.body.address,
      niches: {
        firstNiche: req.body.firstNiche,
        secondNiche: req.body.secondNiche,
        thirdNiche: req.body.thirdNiche,
      },
      coverLetter: req.body.coverLetter,
    };
    const { firstNiche, secondNiche, thirdNiche } = newUserData.niches;

    if (
      req.user.role == "Job Seeker" &&
      (!firstNiche || !secondNiche || !thirdNiche)
    ) {
      return next(
        new ErrorHandler("Please provide your preffered niches", 400)
      );
    }

    if (
      req.files &&
      req.files.avatar &&
      req.files.avatar[0].fieldname === "avatar"
    ) {
      const currentAvatarId = req.user.avatar.public_id;
      if (currentAvatarId) {
        await fileDestroyOnCloudinary(currentAvatarId);
      }
      const avatar = await fileUploadOnCloudinary(req.files.avatar[0].path);
      newUserData.avatar = { public_id: avatar.public_id, url: avatar.url };
    }

    if (
      req.files &&
      req.files.resume &&
      req.files.resume[0].fieldname === "resume"
    ) {
      const currentResumeId = req.user.resume.public_id;
      if (currentResumeId) {
        await fileDestroyOnCloudinary(currentResumeId);
      }
      const resume = await fileUploadOnCloudinary(req.files.resume[0].path);
      newUserData.resume = resume.url;
    }

    const updatedUser = await User.findOneAndUpdate({ _id }, newUserData, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Your profile is successfully updated",
      updatedUser,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.user._id });
    const { oldPassword, password, c_password } = req.body;
    const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Your old password is incorrect", 400));
    }
    if (password !== c_password) {
      return next(
        new ErrorHandler(
          "Your password and confirm passsword are not matched",
          400
        )
      );
    }
    if (password.length < 8) {
      return next(
        new ErrorHandler("Password must contain at least 8 characters", 400)
      );
    }
    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    await user.save();

    const token = await jwt.sign({ _id: user._id }, process.env.JSON_WEB_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    });

    return res.status(200).json({
      success: true,
      message: "Your password is successfully updated",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};
const deleteUser = async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.id });
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }
  const deletedUser = await User.findOneAndDelete({ _id: req.user.id });
  res.clearCookie("token");
  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
    deletedUser,
  });
};

module.exports = {
  createUser,
  logoutUser,
  loginUser,
  getUser,
  updateMyProfile,
  updatePassword,
  deleteUser,
};
