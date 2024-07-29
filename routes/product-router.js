const express = require('express');
const productRouter = express.Router();
const auth = require('../config/auth');
const fs = require('fs');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/product-img');
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

const upload = multer({ storage: storage });

// Get all products
productRouter.get('/', auth.isAdmin, async (req, res) => {
    try {
        const products = await Product.find();
        const count = await Product.count();
        const admin = req.session.admin;
        const success = req.flash('success');
        res.render('admin/products', { products, count, success, admin });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add product form
productRouter.get('/add-product', auth.isAdmin, async (req, res) => {
    try {
        const categories = await Category.find();
        const admin = req.session.admin;
        const error = req.flash('error');
        res.render('admin/add-product', { admin, error, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add product
productRouter.post('/add-product', upload.single('image'), async (req, res) => {
    try {
        const { title, description, author, price, category, publishDate, pageCount } = req.body;
        const image = req.file.filename;
        const existingProduct = await Product.findOne({ title, category });
        if (existingProduct) {
            fs.unlinkSync('public/images/product-img/' + image);
            req.flash('error', 'Product exists, choose another.');
            return res.redirect('/admin/product/add-product');
        }
        const price2 = parseFloat(price).toFixed(2);
        await Product.create({
            title,
            description,
            author,
            price: price2,
            category,
            image,
            publishDate,
            pageCount
        });
        req.flash('success', 'Product added!');
        res.redirect('/admin/product');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit product form
productRouter.get('/edit-product/:id', auth.isAdmin, async (req, res) => {
    try {
        const categories = await Category.find();
        const product = await Product.findById(req.params.id);
        const admin = req.session.admin;
        const error = req.flash('error');
        const success = req.flash('success');
        res.render('admin/edit-product', { admin, success, error, product, categories });
    } catch (err) {
        console.error(err);
        res.render('admin/404');
    }
});

// Edit product
productRouter.post('/edit-product/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, description, author, price, category, publishDate, pageCount } = req.body;
        console.log(req.body);
        const image = req.file ? req.file.filename : req.body.pimage;
        const price2 = parseFloat(price).toFixed(2);
        const product = await Product.findById(req.params.id);
        const existingProduct = await Product.findOne({ title, category, _id: { $ne: req.params.id } });
        if (existingProduct) {
            if (req.file) fs.unlinkSync('public/images/product-img/' + image);
            req.flash('error', 'Product exists, choose another name.');
            return res.redirect('/admin/product/edit-product/' + req.params.id);
        }
        product.title = title;
        product.description = description;
        product.author = author;
        product.price = price2;
        product.category = category;
        product.image = image;
        product.publishDate = publishDate;
        product.pageCount = pageCount;
        await product.save();
        if (req.file && req.body.pimage) {
            fs.unlinkSync('public/images/product-img/' + req.body.pimage);
        }
        req.flash('success', 'Product edited successfully.');
        res.redirect('/admin/product');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete product
productRouter.get('/delete-product/:id', auth.isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        fs.unlinkSync('public/images/product-img/' + product.image);

        await Product.deleteOne({ _id: req.params.id });
        req.flash('success', 'Product deleted successfully!');
        res.redirect('/admin/product');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = productRouter;
