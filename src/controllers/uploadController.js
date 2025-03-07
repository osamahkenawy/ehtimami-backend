const fs = require("fs");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require("../config/aws");
const dotenv = require("dotenv");

dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME;

/**
 * Function to decode Base64 string and extract metadata.
 */
const decodeBase64Image = (base64String) => {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 format");
  }

  return {
    contentType: matches[1], // Extract MIME type (e.g., image/png)
    buffer: Buffer.from(matches[2], "base64"), // Convert Base64 to Buffer
  };
};

exports.uploadFile = async (req, res) => {
  try {
    // ✅ Extract Base64 file from request
    const { file, platform } = req.body;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Decode Base64
    const { contentType, buffer } = decodeBase64Image(file);

    // ✅ Generate unique file name
    const fileName = `${Date.now()}-${platform || "upload"}.png`;

    // ✅ Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // ✅ Generate S3 URL
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    return res.status(200).json({
      message: "File uploaded successfully",
      fileUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
