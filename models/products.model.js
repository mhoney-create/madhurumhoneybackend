import mongoose from "mongoose";

let productSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // Currency for all variant prices
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR"],
    },
    // Product variants with pricing
    variants: [
      {
        size: {
          type: String,
          enum: ["100g", "250g", "500g", "1kg"],
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        discountedPrice: {
          type: Number,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["draft", "active", "outOfStock", "discontinued"],
      default: "draft",
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    certifications: [
      {
        name: String,
        issuedBy: String,
        validUntil: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate discounted prices
productSchema.pre("save", function (next) {
  if (this.variants) {
    this.variants = this.variants.map((variant) => {
      if (variant.discount > 0) {
        variant.discountedPrice = variant.price * (1 - variant.discount / 100);
      } else {
        variant.discountedPrice = variant.price;
      }
      return variant;
    });
  }
  next();
});

export const Product = mongoose.model("Product", productSchema);
