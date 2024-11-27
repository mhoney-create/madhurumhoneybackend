import express from "express";
import multer from "multer";
import { signup, login } from "../controllers/Auth.js";
import { paymentController } from "../controllers/payment.js";
import { auth, isbuyer, isseller } from "../middleware/auth.js";
import {
  addProductsToSite,
  removeProductFromSite,
  editProductInSite,
} from "../controllers/Products.js";

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Set the directory for uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Set file name with timestamp
  },
});
const upload = multer({ storage });

// Routes

router.post("/signup", signup);
router.post("/login", login);
router.post(
  "/createpaymentorder",
  // auth,
  // isbuyer,
  paymentController.createOrder
);
router.post(
  "/success",
  //  auth, isbuyer,
  paymentController.verifyPayment
);
router.post(
  "/addproduct",
  upload.array("images", 5),
  auth,
  isseller,
  addProductsToSite
);
router.delete("/removeproduct", auth, isseller, removeProductFromSite);
router.put(
  "/editproduct",
  upload.single("image"),
  auth,
  isseller,
  editProductInSite
);

export default router;
