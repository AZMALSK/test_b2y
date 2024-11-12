require('dotenv').config(); // To load environment variables
const twilio = require('twilio');

// Configure Twilio client with credentials from .env file
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to send SMS
const sendSMS = async (to, message) => {
  try {
    const sms = await client.messages.create({
      body: message, 
      from: process.env.TWILIO_PHONE_NUMBER, 
      to: to, 
    });
    console.log('SMS sent successfully:', sms.sid);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
};

module.exports = { sendSMS };
