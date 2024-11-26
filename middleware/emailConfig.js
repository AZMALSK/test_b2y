const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  debug: true,
  logger: true,
});

// Function to send an email
const sendEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: '"Gaddamvinay" <vinay.g@b2yinfy.com>', // Sender address
      to: 'gaddamvinay450@gmail.com', // List of recipients
      subject: 'Test Email', // Subject line
      text: 'Hello, this is a test email from Nodemailer!', // Plain text body
      html: '<b>Hello, this is a test email from Nodemailer!</b>', // HTML body
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Verify connection and send a test email
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
    sendEmail();
  }
});

module.exports = transporter;




