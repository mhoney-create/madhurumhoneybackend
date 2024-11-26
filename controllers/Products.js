import { Product } from "../models/products.model.js";
import fs from "fs";
import mongoose from "mongoose";
import Cloudinary from "../utils/cloudinary.js";
import path from "path";
const getFilesFromUploads = (dirPath) => {
  try {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.log("Error reading upload directory:", error);
    return [];
  }
};

// Function to clean uploads directory
const cleanUploadsDirectory = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        fs.unlinkSync(path.join(dirPath, file));
        console.log(`Cleaned up file: ${file}`);
      }
    }
  } catch (error) {
    console.log("Error cleaning uploads directory:", error);
  }
};

export async function addProductsToSite(req, res) {
  const uploadsPath = path.join(process.cwd(), "uploads");

  try {
    // Get files from uploads folder
    const uploadedFiles = getFilesFromUploads(uploadsPath);

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        message: "No images found in uploads folder",
      });
    }

    // Parse JSON data from form-data
    let parsedData = {};
    try {
      // If data is sent as individual fields, parse each JSON string
      parsedData = {
        productName: req.body.productName,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price ? JSON.parse(req.body.price) : {},
        stock: req.body.stock ? JSON.parse(req.body.stock) : {},
        variants: req.body.variants ? JSON.parse(req.body.variants) : [],
        status: req.body.status,
        certifications: req.body.certifications
          ? JSON.parse(req.body.certifications)
          : [],
      };
    } catch (parseError) {
      console.error("Error parsing JSON data:", parseError);
      return res.status(400).json({
        message: "Invalid JSON data format",
        error: parseError.message,
      });
    }

    // Validate required fields
    if (
      !parsedData.productName ||
      !parsedData.title ||
      !parsedData.description
    ) {
      return res.status(400).json({
        message: "Product Name, Title, and Description are required fields.",
      });
    }

    // Upload images to Cloudinary
    const uploadedImages = await Cloudinary(process.cwd(), uploadedFiles);

    // Generate a new ObjectId for productId
    const productId = new mongoose.Types.ObjectId();

    // Create a new product with schema-compliant structure
    const newProduct = new Product({
      productId,
      productName: parsedData.productName,
      title: parsedData.title,
      description: parsedData.description,
      price: {
        basePrice: parsedData.price?.basePrice || 0,
        discount: parsedData.price?.discount || 0,
        currency: parsedData.price?.currency || "INR",
      },
      stock: {
        quantity: parsedData.stock?.quantity || 0,
        lowStockAlert: parsedData.stock?.lowStockAlert || 10,
        sku: parsedData.stock?.sku || `SKU-${productId.toString().slice(-6)}`,
      },
      variants: Array.isArray(parsedData.variants)
        ? parsedData.variants.map((variant) => ({
            size: variant.size,
            price: variant.price,
            stock: variant.stock,
          }))
        : [],
      images: uploadedImages,
      status: parsedData.status || "draft",
      ratings: {
        average: 0,
        count: 0,
      },
      certifications: Array.isArray(parsedData.certifications)
        ? parsedData.certifications.map((cert) => ({
            name: cert.name,
            issuedBy: cert.issuedBy,
            validUntil: cert.validUntil,
          }))
        : [],
    });

    // Validate the complete product against schema
    const validationError = newProduct.validateSync();
    if (validationError) {
      cleanUploadsDirectory(uploadsPath);
      return res.status(400).json({
        message: "Invalid product data",
        errors: validationError.errors,
      });
    }

    // Check if product with same name already exists
    const existingProduct = await Product.findOne({
      productName: parsedData.productName,
    });

    if (existingProduct) {
      cleanUploadsDirectory(uploadsPath);
      return res.status(400).json({
        message: "Product with this name already exists.",
      });
    }

    // Save the new product to the database
    await newProduct.save();

    // Clean up uploads directory after successful save
    cleanUploadsDirectory(uploadsPath);

    // Send success response
    return res.status(201).json({
      message: "Product added successfully.",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error adding product:", error);
    cleanUploadsDirectory(uploadsPath);
    return res.status(500).json({
      message: "An error occurred while adding the product.",
      error: error.message,
    });
  }
}

export async function removeProductFromSite(req, res) {
  try {
    // Extract productid from request params (or query, depending on your route setup)
    const { productid } = req.params;

    // Validate that productid is provided
    if (!productid) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    // Attempt to find and delete the product
    const product = await Product.findOneAndDelete({ productid });

    // Check if the product was found and deleted
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Send success response
    return res.status(200).json({
      message: "Product removed successfully.",
      product: product, // Optionally, return the deleted product data
    });
  } catch (error) {
    // Handle any errors that occurred during the deletion process
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while removing the product.",
      error,
    });
  }
}

export async function editProductInSite(req, res) {
  try {
    // Extract productid from request params (or query, depending on your route setup)
    const { productid } = req.params;

    // Extract updated product data from request body
    const { productname, title, description, discount } = req.body;

    // Validate that productid is provided
    if (!productid) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    // Find the product by productid
    const product = await Product.findOne({ productid });

    // Check if the product exists
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Update the product fields
    if (productname) product.productname = productname;
    if (title) product.title = title;
    if (description !== undefined) product.description = description; // Allow null or empty description
    if (discount !== undefined) product.discount = discount; // Allow discount to be updated even if it's 0

    // Save the updated product
    await product.save();

    // Send success response
    return res.status(200).json({
      message: "Product updated successfully.",
      product: product, // Return the updated product data
    });
  } catch (error) {
    // Handle any errors
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while updating the product.",
      error,
    });
  }
}
