import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
export default async function Cloudinary(__dirname, filesarr, height, quality) {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Array to store all upload results
    const uploadResults = [];

    // Upload each file to Cloudinary
    for (const file of filesarr) {
      const filePath = path.join(__dirname, "uploads", file);
      try {
        // Using Promise-based upload instead of callback
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: file,
          // height: height,
          // quality: quality,
        });
        uploadResults.push({
          url: result.secure_url,
          alt: file,
          isPrimary: uploadResults.length === 0, // First image is primary
        });

        // Delete file after successful upload
        fs.unlink(filePath, () => {
          console.log(`File deleted: ${file}`);
        });
      } catch (uploadError) {
        console.log(`Error uploading ${file}:`, uploadError);
      }
    }

    return uploadResults;
  } catch (error) {
    console.log("Error occurred in Cloudinary:", error.message);
    return [];
  }
}
