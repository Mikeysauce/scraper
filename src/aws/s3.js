const AWS = require("aws-sdk");

const bucketPromise = new AWS.S3()
  .getObject({ Bucket: "scraperconfig", Key: "retailers.json" })
  .promise();

const getFromS3 = async () => {
  try {
    const { Body, ...rest } = await bucketPromise;
    return JSON.parse(Body.toString() || {});
  } catch (error) {
    console.log(error);
  }
};

module.exports = getFromS3;
