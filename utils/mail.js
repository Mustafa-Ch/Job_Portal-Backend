const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  service: "gmail",
  host:process.env.SMTP_HOST,
  port:process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_MAIL,
    pass:process.env.SMTP_MAIL_PASS,
  },
});

const sendMail = (email, subject, text) => {
  const options = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    text,
  };
  transport.sendMail(options);
};

module.exports = sendMail;
