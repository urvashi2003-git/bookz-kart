const express = require('express');
const adminRouter = express.Router();
const auth = require('../config/auth');
const bcrypt = require('bcrypt');
const fs = require('fs');
const Admin = require('../models/adminModel');
const User = require('../models/userModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Coupon = require('../models/couponModel');





const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/banner-img');
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
})
const upload = multer({ storage: storage });

let admin;

adminRouter.get("/register-admin", async (req, res) => {
    // const { name, email, contact, password } = req.body;
    const name = "admin";
    const email = "admin@bookz.cart.in";
    const contact = "1234567890";
    const password = "admin123";

    try {
        if (!name || !email || !contact || !password) {
            throw new Error("Please fill all the fields->name, email, contact, password");
        }

        let user = await Admin.findOne({ email });

        if (user) {
            throw new Error(`This Email is already registered  in the name '${user.name}'`);
        }
        const hPasswd = await bcrypt.hash(password, 10);
        user = new Admin({
            name: name,
            email: email,
            contact: contact,
            password: hPasswd,
        });

        const savedUser = await user.save();

        res.json({ message: "Admin registered successfully" });
    } catch (error) {
        console.log(error.message);
        req.flash("error", "Something went wrong!");
        res.json({ error: error.message });;
    }
});

adminRouter.get('/', async (req, res) => {
    if (req.session.admin)

        res.redirect('/admin/dashboard');

    else {

        const error = req.flash('error');
        res.render('admin/login-ad', { error: error });
    }
});

adminRouter.post('/', async (req, res) => {

    const { email, password } = req.body;

    const adminData = await Admin.findOne({ email: email });
    if (!adminData) {
        req.flash('error', 'Incorrect email or password');
        return res.redirect('/admin');
    }

    const match = await bcrypt.compare(password, adminData.password);

    if (!match) {
        req.flash('error', 'Incorrect email or password');
        return res.redirect('/admin');
    }
    if (adminData) {

        console.log('admin dash');
        req.session.admin = true;
        res.redirect('/admin/dashboard');

    } else {

        req.flash('error', 'Incorrect email or password');
        return res.redirect('/admin');

    }

});

adminRouter.get('/dashboard', auth.isAdmin, async (req, res) => {

    admin = req.session.admin;
    let productCount = await Product.count();
    let orderCount = await Order.aggregate([{ $match: { status: 'delivered' } }, { $unwind: '$orderDetails' }, { $count: 'orderDetails' }]);
    let user = await User.aggregate([{ $match: {} }, { $group: { _id: '$verified', count: { $sum: 1 } } }, { $sort: { _id: -1 } }]);
    let categories = await Category.find({})
    let total = await Order.aggregate([
        {
            $match: {
                status: 'delivered'
            }
        },
        {
            $group: {
                _id: 'null',
                total: {
                    $sum: '$total'
                },
                totalDisc: {
                    $sum: '$discount'
                },
                totalShip: {
                    $sum: '$shipping'
                }
            }
        }
    ])
    let recentOrders = await Order.aggregate([
        {
            $match: {
                status: 'placed'
            }
        },
        {
            $sort: {
                date: -1
            }
        },
        {
            $unwind: '$orderDetails'
        },
        {
            $limit: 10
        },
        {
            $project: {
                userId: 1,
                'orderDetails.product': 1,
                date: 1,
                _id: 0
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'orderDetails.product',
                foreignField: '_id',
                as: 'product'
            }
        },
        {
            $unwind: '$product'
        },
        {
            $unwind: '$user'
        },
        {
            $project: {
                'product.title': 1,
                'product.image': 1,
                'user.name': 1,
                date: 1
            }
        },
        {
            $sort: {
                date: 1
            }
        }
    ])
    console.log(total);
    console.log(recentOrders);
    console.log(user);


    res.render('admin/dashboard', { admin, productCount, total, user, recentOrders, orderCount, categories });

});
adminRouter.get('/chart', async (req, res) => {
    let categories = await Order.aggregate([
        {
            $match: {
                status: 'delivered'
            }

        },
        {
            $unwind: '$orderDetails'
        },
        {
            $project: {
                orderDetails: 1,
                _id: 0
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'orderDetails.product',
                foreignField: '_id',
                as: 'items'
            }
        },
        {
            $unwind: '$items'
        },
        {
            $project: {
                'items.category': 1,
                _id: 0,
                'orderDetails.quantity': 1
            }
        },
        {
            $group: {
                _id: '$items.category',
                count: {
                    $sum: 1
                }
            }
        }

    ]);
    let orders = await Order.aggregate([
        {
            $match: {
                status: 'delivered'
            }

        },
        {
            $unwind: '$orderDetails'
        },
        {
            $group: {
                _id: {

                    $slice: [{
                        $split: [
                            "$date", " "
                        ]
                    }, 1, 1]

                },
                count:
                    { $sum: 1 }

            }
        }
    ]);
    console.log(orders)
    console.log(categories)

    res.json({ orders, categories });
});
adminRouter.get('/logout', (req, res) => {

    req.session.destroy();
    res.redirect('/admin');

});



adminRouter.get('/users', auth.isAdmin, async (req, res) => {

    let count = await User.count();

    User.find((err, users) => {

        if (err) return console.log(err);

        admin = req.session.admin;

        res.render('admin/users', { users: users, admin, count });

    });

});

// adminRouter.get('/users/delete/:id', auth.isAdmin, (req, res) => {

//     Users.findByIdAndRemove(req.params.id, (err) => {

//         if (err) return console.log(err);

//         res.redirect('/admin/users');

//     });

// });

adminRouter.get('/users/block/:id', auth.isAdmin, (req, res) => {

    User.findByIdAndUpdate(req.params.id, { status: "true" }).then((err) => {

        if (err) console.log(err);

        res.redirect('/admin/users');

    });

});

adminRouter.get('/users/unblock/:id', auth.isAdmin, (req, res) => {

    User.findByIdAndUpdate(req.params.id, { status: "false" }).then((err) => {

        if (err) console.log(err);

        res.redirect('/admin/users');

    });

});

adminRouter.get('/not', (req, res) => {

    res.render('admin/404');

});


module.exports = adminRouter