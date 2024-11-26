import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import otpgenerator from "otp-generator";
import jwt from "jsonwebtoken";
// send otp to the mail

async function signup(req, res) {
  try {
    let {
      firstname,
      lastname,
      email,
      password,
      confirmpassword,
      phonenumber,
      role,
    } = req.body;

    if (!firstname || !lastname || !email || !password || !confirmpassword) {
      return res.status(403).json({
        message: "fill all the required fields",
      });
    }

    if (password !== confirmpassword) {
      return res.status(401).json({
        message: "password and confirm password are not the same",
      });
    }

    let userexists = await User.findOne({ phonenumber });

    if (userexists) {
      return res.status(400).json({
        message: "user already exists",
      });
    }

    let hashedpassword = await bcrypt.hash(password, 10);

    let user = await User.create({
      firstname,
      lastname,
      email,
      phonenumber: phonenumber,
      password: hashedpassword,
      role,
    });

    return res.status(200).json({
      user: user,
    });
  } catch (error) {
    console.log("error in signup():", error.message);
    return res.status(500).json({
      message: "user registration failed please try again",
    });
  }
}

// log in user
async function login(req, res) {
  try {
    let { phonenumber, password } = req.body;

    // validation of data

    if (!phonenumber || !password) {
      return res.status(400).json({
        message: "both phonenumber and password are required for login",
      });
    }

    let isuserexists = await User.findOne({ phonenumber });

    if (!isuserexists) {
      return res.status(400).json({
        message: "you didn't create your account, please signup first!",
      });
    }

    // password matching

    let isMatch = await bcrypt.compare(password, isuserexists.password);
    // console.log("accounttye:", isuserexists.accountType);
    //create jwt token
    if (isMatch) {
      const token = jwt.sign(
        {
          phonenumber: isuserexists.phonenumber,
          id: isuserexists._id,
          accountType: isuserexists.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "2h",
        }
      );
      isuserexists.token = token;
      isuserexists.password = undefined;
      res
        .cookie("token", token, {
          httpOnly: true,
          expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        })
        .status(200)
        .json({
          message: "token successfully added into the cookies",
        });
    } else {
      res.status(400).json({
        message: "please check the entered password",
      });
    }
  } catch (error) {
    console.log("error in login function:", error);
    res.status(400).json({
      message: "something went wrong in login function",
    });
  }
}

// change password
async function changepassword(req, res) {}

export { signup, login };
