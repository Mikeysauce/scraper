const Twilio = require("twilio");

const {
  TWILIO_ACCOUNT_SID: accountSid,
  TWILIO_AUTH_TOKEN: authToken,
  TWILIO_PHONE_NUMBER: hostNunber,
  TWILIO_TARGET_PHONE_NUMBER: targetNumber,
} = process.env;

const sendSMS = async (body) => {
  const client = new Twilio(accountSid, authToken);

  const message = await client.messages.create({
    body,
    to: targetNumber,
    from: hostNunber,
  });

  return message;
};

// const sendSMS = async (body) => {
//   return new Promise((resolve) => resolve(body));
// };

module.exports = sendSMS;
