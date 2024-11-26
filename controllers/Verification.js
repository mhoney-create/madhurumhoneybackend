import { Otp } from "../models/otpemail.model.js";
import otpgenerator from "otp-generator";
async function verifyEmail(req, res) {
  try {
    const { email } = req.body;
    const recentotp = await Otp.find({ email })
      .sort({ createdAt: -1 })
      .limit(1); //-1 represents descending order and limit represents the size of the array is limited to 1
    console.log("recent otp is:", recentotp);

    if (recentotp.length === 0) {
      return res.status(400).json({
        message: "otp not found in the database",
      });
    } else if (otp !== recentotp[0].otp) {
      return res.status(400).json({
        message: "invalid otp entered",
      });
    }
    return res.status(200).json({
      message: "successfully verified email",
    });
  } catch (error) {
    console.log("verifyemail func error:", error.message);
  }
}
async function sendverificationemail(req, res) {
  try {
    const { email } = req.body;

    let otp = otpgenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const result = await Otp.find({ otp });

    while (result.length > 0) {
      let otp = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      const result = await Otp.find({ otp });
      console.log(result);
    }
    const otpi = await Otp.create({
      email,
      otp,
    });

    console.log(otpi);
    return res.status(200).json({
      success: true,
      message: "otp successfully sent to mail",
      otp: otpi,
    });
  } catch (error) {
    console.log("error occured in sendverificationemail", error.message);
  }
}
