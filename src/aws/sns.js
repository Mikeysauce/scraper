const AWS = require("aws-sdk");
const TOPIC_ARN = "arn:aws:sns:eu-west-1:556236578538:ConsoleStock";

const sendNotification = async (message, type = "email") => {
  const params = {
    Message: message,
    TopicArn: TOPIC_ARN,
  };

  try {
    await new AWS.SNS({}).publish(params).promise();
  } catch (error) {
    console.log(error);
  }
};

module.exports = sendNotification;
