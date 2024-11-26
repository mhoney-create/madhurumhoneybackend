import mongoose from "mongoose";

let userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phonenumber: {
    type: String,
    required: true,
  },
  phoneverified: {
    type: Boolean,
    default: false,
  },
  emailverified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["buyer", "seller", "admin"], // assuming there are two roles, adjust as needed
    default: "buyer",
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // assuming there's an Order model
    },
  ],
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
});

export const User = mongoose.model("User", userSchema);
