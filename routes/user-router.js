const express = require("express");
const userRouter = express.Router();
const User = require("../models/userModel");
const Address = require("../models/addressModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistModel");

const bcrypt = require("bcrypt");
const securePassword = async (password) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return passwordHash;
};
const secureString = async (uniqueString) => {
  const stringHash = await bcrypt.hash(uniqueString, 10);
  return stringHash;
};


userRouter.get("/", async (req, res) => {
  const user = req.session.user;

  const categories = await Category.find({});
  const products = await Product.find({});
  const specials = await Product.find({ special: true });
  let count = null;
  if (user) {
    req.session.user.discount = null;

    const cartItems = await Cart.findOne({ userId: user._id });

    if (cartItems) {
      count = cartItems.cart.length;
    }
  }
  let wishcount = null;

  if (user) {
    const wishlistItems = await Wishlist.findOne({ userId: user._id });

    if (wishlistItems) {
      wishcount = wishlistItems.wishlist.length;
    }
  }
  console.log(count);
  res.render("user/homepage", {
    user,
    categories,
    specials,
    count,
    wishcount,
    products
  });
});

userRouter.get("/register", (req, res) => {
  if (req.session.user) res.redirect("/home");
  else {
    const error = req.flash("error");
    const success = req.flash("success");

    res.render("user/signup", { error: error, success: success });
  }
});

userRouter.post("/register", async (req, res) => {
  const { name, email, contact, password, image } = req.body;
  try {
    let user = await User.findOne({ email });

    if (user) {
      req.flash(
        "error",
        `This Email is already registered  in the name '${user.name}'`
      );
      return res.redirect("/register");
    }
    const hPasswd = await bcrypt.hash(password, 10);
    user = new User({
      name: name,
      email: email,
      contact: contact,
      password: hPasswd,
      image: image,
      status: false,
    });

    const savedUser = await user.save();

    let address = new Address({
      userId: savedUser._id,
      details: [],
    });

    await address.save();
    req.flash(
      "error",
      `This Email is already registered  in the name '${user.name}'`
    );
  } catch (error) {
    console.log(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/register");
  }
});

// userRouter.get("/verify", async (req, res) => {
//   let { userId, uniqueString } = req.query;

//   const foundUser = await User.findByIdAndDelete({ _id: userId })

//   req.flash(
//     "error",
//     `Your verification link has expired.Signup again`
//   );

//   res.redirect("/register");
// })
//   .catch((error) => {
//     console.log("err in user deletion");
//   });
// })
//   .catch ((error) => {
//   console.log(error);
//   console.log("err in email deletion");
// });
//         } else {
//   bcrypt
//     .compare(uniqueString, hashedString)
//     .then((result) => {
//       if (result) {
//         User.updateOne({ _id: userId }, { $set: { verified: true } })
//           .then(() => {
//             EmailVerification.deleteMany({ userId })
//               .then(() => {
//                 req.flash(
//                   "success",
//                   "Your email has been verified.Go and Login now !"
//                 );

//                 res.redirect("/login");
//               })
//               .catch((error) => {
//                 console.log(error);
//               });
//           })
//           .catch((error) => {
//             console.log(error);
//           });
//       } else {
//         req.flash(
//           "error",
//           `Verification link is not valid.Signup again.`
//         );

//         res.redirect("/register");
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// }
//       } else {
//   req.flash("error", `No registered User found`);

//   res.redirect("/register");
// }
//     })
//     .catch ((error) => {
//   console.log(error);
//   console.log("error in find");
// });
// });

userRouter.get("/login", (req, res) => {
  req.session.account = null;
  if (req.session.user) {
    res.redirect("/");
  } else {
    const error = req.flash("error");
    const success = req.flash("success");
    res.render("user/login", { error: error, success: success });
  }
});

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const userData = await User.findOne({ email });

  if (!userData) {
    req.flash("error", "No User found!");
    return res.redirect("/login");
  }
  const passwordMatch = await bcrypt.compare(password, userData.password);
  if (!passwordMatch) {
    req.flash("error", "Your Password is wrong!");

    return res.redirect("/login");
  }

  if (userData.status) {
    req.flash("error", "Your account is blocked by admin.");

    return res.redirect("/login");
  }
  req.session.user = userData;

  res.redirect("/");
});

userRouter.get("/forgot-password", async (req, res) => {
  let error = req.flash("error");
  let success = req.flash("success");
  let account = null;
  if (req.session.account) {
    account = req.session.account;
  }
  res.render("user/forgot-password", { error, success, account });
});

// userRouter.post("/check-email", async (req, res) => {
//   let email = req.body.email;
//   await User.findOne({ email: email }).then(async (account) => {
//     if (account) {
//       req.session.account = account;
//       await sendPasswordResetOtp(account, res)
//         .then(() => {
//           req.flash("success", "OTP has been sent. Check your email.");
//           res.redirect("/forgot-password");
//         })
//         .catch((error) => {
//           req.flash("error", "OTP has not been sent.");
//           res.redirect("/forgot-password");
//         });
//     } else {
//       req.flash("error", "No user found");
//       res.redirect("/forgot-password");
//     }
//   });
// });

// userRouter.get("/resend-otp", async (req, res) => {
//   await sendPasswordResetOtp(req.session.account, res);
//   res.redirect("/forgot-password");
// });
// userRouter.post("/verify-otp/:id", async (req, res) => {
//   let bodyotp = req.body.otp;
//   // let otp = await securePassword(bodyotp);
//   let id = req.params.id;
//   console.log(bodyotp);
//   Otp.find({ userId: id })

//     .then((result) => {
//       if (result.length > 0) {
//         const { expiresAt } = result[result.length - 1];
//         console.log(expiresAt);
//         const sentOtp = result[result.length - 1].otp;
//         if (expiresAt < Date.now()) {
//           console.log("expired");
//           Otp.findOneAndDelete({ userId: id })
//             .then((result) => {
//               req.flash("error", "OTP has expired,try again.");
//               res.redirect("/forgot-Password");
//             })
//             .catch((error) => {
//               console.log(error);
//               console.log("err in email deletion");
//             });
//         } else {
//           console.log(bodyotp + "  " + sentOtp);

//           if (bodyotp == sentOtp) {
//             // User.updateOne({ _id: userId }, { $set: { verified: true } })
//             //     .then(() => {
//             //         EmailVerification.deleteOne({ userId })
//             //             .then(() => {
//             //                 req.flash('success', 'Your email has been verified.Go and Login now !')

//             //                 res.redirect('/register')
//             //             })
//             //             .catch(error => {
//             //                 console.log(error);
//             //             })
//             //     })
//             //     .catch(error => {
//             //         console.log(error);
//             //     })
//             Otp.deleteMany({ userId: id });
//             req.session.account.otp = true;
//             req.flash("success", "Now update your password");
//             res.redirect("/forgot-password");
//           } else {
//             req.flash("error", `Otp is invalid.`);

//             res.redirect("/forgot-password");
//           }
//         }
//       } else {
//         req.flash("error", `No registered User found`);

//         res.redirect("/forgot-password");
//       }
//     })
//     .catch((error) => {
//       console.log(error);
//       console.log("error in find");
//     });
// });

userRouter.post("/change-password/:id", async (req, res) => {
  let { npassword } = req.body;
  let id = req.params.id;
  let spassword = await securePassword(npassword);
  console.log(id);
  await User.findById(id, async (err, user) => {
    console.log(user);
    user.password = spassword;
    await user.save();
    req.flash("success", "Password changed successfully");
    res.redirect("/login");
  }).clone();
});

userRouter.get("/about", async (req, res) => {
  const user = req.session.user;

  let count = null;
  if (user) {
    req.session.user.discount = null;

    const cartItems = await Cart.findOne({ userId: user._id });

    if (cartItems) {
      count = cartItems.cart.length;
    }
  }
  let wishcount = null;

  // let t = await Cart.findOne({ userId: id }).populate("cart.product");
  if (user) {
    const wishlistItems = await Wishlist.findOne({ userId: user._id });

    if (wishlistItems) {
      wishcount = wishlistItems.wishlist.length;
    }
  }
  res.render("user/about", { user, count, wishcount });
});

userRouter.get("/contact", async (req, res) => {
  const user = req.session.user;

  let count = null;
  if (user) {
    req.session.user.discount = null;

    const cartItems = await Cart.findOne({ userId: user._id });

    if (cartItems) {
      count = cartItems.cart.length;
    }
  }
  let wishcount = null;

  // let t = await Cart.findOne({ userId: id }).populate("cart.product");
  if (user) {
    const wishlistItems = await Wishlist.findOne({ userId: user._id });

    if (wishlistItems) {
      wishcount = wishlistItems.wishlist.length;
    }
  }
  res.render("user/contact", { user, count, wishcount });
});

userRouter.post("/search", async (req, res) => {
  let payload = req.body.payload.trim();
  let search = await Product.find({
    title: { $regex: new RegExp(payload + ".*", "i") },
  }).exec();
  search = search.slice(0, 10);
  console.log(payload);
  res.json({ payload: search });
});
userRouter.get("/logout", (req, res) => {
  req.session.user = null;
  req.flash("success", "You are logged out successfully!");
  res.redirect("/login");
});

module.exports = userRouter;
