import mongoose from "mongoose";

let orderSchema = new mongoose.Schema({
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      productName: {
        type: String,
        required: true,
        trim: true,
      },
      size: {
        type: String,
        enum: ["100g", "250g", "500g", "1kg"],
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      // Optional: store the discounted price if applicable
      // discountedPrice: {
      //   type: Number,
      //   min: 0,
      // },
      // // Optional: store the applied discount percentage
      // discount: {
      //   type: Number,
      //   min: 0,
      //   max: 100,
      //   default: 0,
      // },
    },
  ],
  trackingId: {
    type: String,
    required: true,
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
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "INR",
    enum: ["INR", "USD", "EUR"],
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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Processing", "Confirmed", "Shipped", "Delivered", "Cancelled"],
    default: "Processing",
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
  this.status = "Confirmed";
  await this.save();
  return this;
};

// Pre-save middleware to validate total amount
// orderSchema.pre("save", function (next) {
//   if (this.isModified("items")) {
//     const calculatedTotal = this.items.reduce((sum, item) => {
//       const itemPrice = item.discountedPrice || item.price;
//       return sum + itemPrice * item.quantity;
//     }, 0);

//     if (this.isNew || Math.abs(this.totalAmount - calculatedTotal) > 0.01) {
//       this.totalAmount = calculatedTotal;
//     }
//   }
//   next();
// });

export const Order = mongoose.model("Order", orderSchema);
