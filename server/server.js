
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("node:dns");
require("dotenv").config();
const Product = require("./models/product");
const Order = require("./models/order");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SnackStop API is running!");
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on port ${process.env.PORT || 5000}`
      );
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ message: "Failed to fetch product" });
  }
});



app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      address,
      landmark,
      items,
    } = req.body;

  
    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof phoneNumber !== "string" ||
      !phoneNumber.trim() ||
      typeof address !== "string" ||
      !address.trim()
    ) {
      return res.status(400).json({
        message: "Name, phone number and address are required.",
      });
    }

    if (
      customerName.trim().length > 100 ||
      phoneNumber.trim().length > 20 ||
      address.trim().length > 500 ||
      (landmark !== undefined &&
        (typeof landmark !== "string" || landmark.length > 150))
    ) {
      return res.status(400).json({
        message: "One or more customer fields are invalid.",
      });
    }

    if (!/^[0-9+() -]{8,20}$/.test(phoneNumber.trim())) {
      return res.status(400).json({
        message: "Please provide a valid phone number format.",
      });
    }


    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "An order must contain at least one item.",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        message: "Too many items in one order.",
      });
    }


    for (const item of items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Each item needs a valid product ID and positive integer quantity.",
        });
      }
    }


    const quantities = new Map();

    for (const item of items) {
      const productId = item.productId;
      const combinedQuantity =
        (quantities.get(productId) || 0) + item.quantity;

      if (!Number.isSafeInteger(combinedQuantity)) {
        return res.status(400).json({
          message: "Invalid total quantity.",
        });
      }

      quantities.set(productId, combinedQuantity);
    }


    const productIds = [...quantities.keys()];
    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({
        message: "One or more products could not be found.",
      });
    }


    const orderItems = [];
    let subtotal = 0;

    for (const product of products) {
      const quantity = quantities.get(product._id.toString());

      if (
        !Number.isSafeInteger(product.stock) ||
        product.stock < quantity
      ) {
        return res.status(409).json({
          message: `Insufficient stock for ${product.name}.`,
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(500).json({
          message: "A product has an invalid price.",
        });
      }

      orderItems.push({
        productId: product._id,
        productName: product.name,
        price,
        quantity,
      });

      subtotal += price * quantity;
    }


    const deliveryFee = subtotal >= 199 ? 0 : 20;
    const totalPrice = subtotal + deliveryFee;


    const order = new Order({
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      landmark: landmark?.trim() || "",
      items: orderItems,
      subtotal,
      deliveryFee,
      totalPrice,
      orderStatus: "pending",
      paymentStatus: "unpaid",
      paymentProvider: "none",
      paymentReference: null,
    });


    await order.save();


    return res.status(201).json({
      message: "Order received successfully. Awaiting confirmation.",
      order: {
        _id: order._id,
        customerName: order.customerName,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        totalPrice: order.totalPrice,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating order:", error);

    if (error.name === "ValidationError" ||
        error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid order data.",
      });
    }

    return res.status(500).json({
      message: "Failed to create order.",
    });
  }
});


startServer();
