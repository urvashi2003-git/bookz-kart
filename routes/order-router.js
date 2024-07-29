const express = require("express");
const orderRouter = express.Router();
const Product = require("../models/productModel");
const Wishlist = require("../models/wishlistModel");
const Cart = require("../models/cartModel");
const auth = require("../config/auth");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");

// Middleware function to get the count of cart items
async function getCartItemCount(userId) {
  const cartItems = await Cart.findOne({ userId: userId });
  return cartItems ? cartItems.cart.length : 0;
}

// Middleware function to get the count of wishlist items
async function getWishlistItemCount(userId) {
  const wishlistItems = await Wishlist.findOne({ userId: userId });
  return wishlistItems ? wishlistItems.wishlist.length : 0;
}

orderRouter.get("/", auth.isUser, async (req, res) => {
  try {
    const user = req.session.user;

    // Reset discount on the user session
    req.session.user.discount = null;

    const [cartCount, wishCount, orders] = await Promise.all([
      getCartItemCount(user._id),
      getWishlistItemCount(user._id),
      Order.find({ userId: user._id })
        .populate([
          {
            path: "orderDetails",
            populate: {
              path: "product",
              model: "Product",
            },
          },
        ])
        .sort({ date: -1 }),
    ]);
    console.log("Orders:", orders);
    res.render("user/orders", { user, count: cartCount, wishcount: wishCount, order: orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.render("user/404");
  }
});

orderRouter.get("/order-details/:id", auth.isUser, async (req, res) => {
  try {
    const user = req.session.user;
    const id = req.params.id;

    const [cartCount, wishCount, order] = await Promise.all([
      getCartItemCount(user._id),
      getWishlistItemCount(user._id),
      Order.findById(id)
        .populate([
          {
            path: "orderDetails",
            populate: {
              path: "product",
              model: "Product",
            },
          },
        ]),
    ]);

    if (!order) {
      throw new Error("Order not found");
    }

    res.render("user/order-single-details", { user, count: cartCount, wishcount: wishCount, order });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.render("user/404");
  }
});

orderRouter.get("/order-cancel/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const item = await Order.findById(id);
    if (!item) {
      throw new Error("Order not found");
    }
    item.status = "cancelled";
    await item.save();
    console.log("Order updated:", item);
    res.json({ status: true });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = orderRouter;
