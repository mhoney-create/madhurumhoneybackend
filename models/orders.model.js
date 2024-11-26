import mongoose from "mongoose";

let orderSchema = new mongoose.Schema({
  items: [
    {
      productid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // assuming there's a Product model
        required: true,
      },
      productname: {
        type: String,
        required: true,
        trim: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  trackingid: {
    type: String,
    required: true,
    unique: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
  },
  razorpayOrderId: {
    type: String,
    required: false,
  },
  razorpayPaymentId: {
    type: String,
    required: false,
  },
  razorpaySignature: {
    type: String,
    required: false,
  },
});

// Method to update payment details after successful payment
orderSchema.methods.updatePaymentDetails = async function (
  paymentId,
  orderId,
  signature
) {
  this.paymentStatus = "Completed";
  this.razorpayOrderId = orderId;
  this.razorpayPaymentId = paymentId;
  this.razorpaySignature = signature;
  await this.save();
  return this;
};

export const Order = mongoose.model("Order", orderSchema);
