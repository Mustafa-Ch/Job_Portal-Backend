const express = require("express");
const errorMiddleware = require("./middleware/errorMiddleware");
const app = express();
const PORT = 4000;
const cors = require("cors");
const DB_CONNECTION = require("./config/dbConnection");
const cookieParser = require("cookie-parser");
const userRouter = require("./routes/user");
const jobRouter = require("./routes/job");
const newsLetterSent = require("./automation/newsletter");
const applicationRouter = require("./routes/application");
const { config } = require("dotenv");
config({ path: "./.env" });

const options = {
  origin: process.env.Front_End_Url,
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

//DB CONNECTION
DB_CONNECTION();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(options));
// Routes
app.use("/user/v1", userRouter);
app.use("/job/v1", jobRouter);
app.use("/application/v1", applicationRouter);
// Error Middleware
app.use(errorMiddleware);

// Email Automation
newsLetterSent();
app.listen(process.env.PORT, () => {
  console.log(`Server listening at port ${process.env.PORT}`);
});

