const mongoose = require("mongoose");

const dbConnection = async () => {
  try {
    await mongoose.connect(process.env.Mongo_Uri);
    console.log("DB CONNECTED SUCCESSFULLY...");
  } catch (error) {
    console.log(error);
  }
};
module.exports = dbConnection;
