const AWS = require("aws-sdk");
const chalk = require("chalk");

const getFromS3 = async () => {
  try {
    console.log(chalk.cyan("Updating retailer.json from s3.."));
    const { Body, ...rest } = await new AWS.S3()
      .getObject({ Bucket: "scraperconfig", Key: "retailers.json" })
      .promise();
    console.log(chalk.cyan("Update completed"));
    return JSON.parse(Body.toString() || {});
  } catch (error) {
    console.log(error);
  }
};

module.exports = getFromS3;
