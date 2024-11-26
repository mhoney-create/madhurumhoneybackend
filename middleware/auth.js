import jwt from "jsonwebtoken";
import express from "express";

//auth
async function auth(req, res, next) {
  try {
    console.log(req.cookies);
    let token = req.cookies.token;

    if (!token) {
      res.status(400).json({
        message: "no token found in the cookies",
      });
    }

    // verify the token with the token secret

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (error) {
      console.log("error occured while verifying the token in the middleware");
      res.status(400).json({
        message: "token is not valid",
      });
    }
    next();
  } catch (error) {
    res.status(400).json({
      message: "error occured in the auth function in the middle ware",
    });
    console.log(
      "error occured in the auth function in the middle ware:",
      error.message
    );
  }
}

// isbuyer
async function isbuyer(req, res, next) {
  try {
    const token = req.cookies.token;
    if (req.user.accountType !== "buyer") {
      res.status(400).json({
        message: "this is a protected route for buyers",
      });
    }
    next();
  } catch (error) {
    console.log("error occurred in isbuyer middleware:", error.message);
    res.status(400).json({
      message: error.message,
    });
  }
}

// isseller
async function isseller(req, res, next) {
  try {
    const token = req.cookies.token;
    if (req.user.accountType !== "seller") {
      res.status(400).json({
        message: "this is a protected route for sellers",
      });
    }
    next();
  } catch (error) {
    console.log("error occurred in isseller middleware:", error.message);
    res.status(400).json({
      message: error.message,
    });
  }
}

// isadmin
async function isadmin(req, res, next) {
  try {
    const token = req.cookies.token;
    if (req.user.accountType !== "admin") {
      res.status(400).json({
        message: "this is a protected route for admin",
      });
    }
    next();
  } catch (error) {
    console.log("error occurred in isadmin middleware:", error.message);
    res.status(400).json({
      message: error.message,
    });
  }
}

export { auth, isbuyer, isseller, isadmin };
