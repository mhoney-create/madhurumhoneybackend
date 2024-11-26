import { Order } from "../models/orders.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Product } from "../models/products.model.js";
export const paymentController = {
  // Create a new order and initialize payment
  async createOrder(req, res) {
    try {
      const { items, totalAmount, userId } = req.body;

      // Generate unique tracking ID
      const trackingId = crypto.randomBytes(16).toString("hex");

      // Create order in database first
      const newOrder = await Order.create({
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        trackingId: trackingId,
        userId: userId,
        paymentStatus: "Pending",
      });

      // Initialize Razorpay
      const razorpay = new Razorpay({
        key_id: process.env.RAZOR_PAY_KEY_ID,
        key_secret: process.env.RAZOR_PAY_KEY_SECRET,
      });

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // Convert to smallest currency unit
        currency: "INR",
        receipt: trackingId,
        payment_capture: 1,
        notes: {
          orderId: newOrder._id.toString(),
        },
      });

      res.status(200).json({
        success: true,
        order: {
          id: razorpayOrder.id,
          currency: razorpayOrder.currency,
          amount: razorpayOrder.amount,
          receipt: razorpayOrder.receipt,
        },
        trackingId: trackingId,
      });
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      });
    }
  },

  // Verify payment and update order status
  async verifyPayment(req, res) {
    try {
      const {
        orderCreationId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      } = req.body;

      // Verify payment signature
      const shasum = crypto.createHmac(
        "sha256",
        process.env.RAZOR_PAY_KEY_SECRET
      );
      shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
      const digest = shasum.digest("hex");

      if (digest !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
        });
      }

      // Find order
      const order = await Order.findOne({ trackingId: orderCreationId });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Start a session for transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Update product quantities
        for (const item of order.items) {
          const product = await Product.findById(item.productid).session(
            session
          );

          if (!product) {
            throw new Error(`Product not found: ${item.productid}`);
          }

          // Check if enough stock is available
          if (product.stock.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for product: ${product.productName}`
            );
          }

          // Update stock quantity
          product.stock.quantity -= item.quantity;

          // Check if stock reaches low alert threshold
          if (product.stock.quantity <= product.stock.lowStockAlert) {
            // You could implement notification logic here
            console.log(`Low stock alert for product: ${product.productName}`);
          }

          // If stock becomes 0, update status
          if (product.stock.quantity === 0) {
            product.status = "outOfStock";
          }

          await product.save({ session });
        }

        // Update order with payment details
        order.paymentStatus = "Completed";
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpayOrderId = razorpayOrderId;
        order.razorpaySignature = razorpaySignature;
        await order.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        res.status(200).json({
          success: true,
          message: "Payment verified and stock updated successfully",
          order: {
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            trackingId: orderCreationId,
          },
        });
      } catch (error) {
        // If anything fails, abort transaction
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed",
        error: error.message,
      });
    }
  },

  // Get payment status
  async getPaymentStatus(req, res) {
    try {
      const { trackingId } = req.params;

      const order = await Order.findOne({ trackingId }).select(
        "paymentStatus razorpayOrderId razorpayPaymentId orderDate"
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.status(200).json({
        success: true,
        payment: {
          status: order.paymentStatus,
          orderId: order.razorpayOrderId,
          paymentId: order.razorpayPaymentId,
          orderDate: order.orderDate,
        },
      });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment status",
        error: error.message,
      });
    }
  },

  // Get payment history for a user
  async getPaymentHistory(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const orders = await Order.find({ userId })
        .select("trackingId paymentStatus razorpayPaymentId orderDate items")
        .sort({ orderDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await Order.countDocuments({ userId });

      res.status(200).json({
        success: true,
        payments: orders,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Payment history fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
        error: error.message,
      });
    }
  },
};
