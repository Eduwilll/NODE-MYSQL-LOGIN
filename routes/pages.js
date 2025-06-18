const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();

router.get('/', authController.isLoggedIn, (req, res) => {
    res.render('index', {
        user: req.user
    });
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', authController.isLoggedIn, (req, res) => {
    if (req.user) {
        return res.redirect('/profile');
    }
    res.render('login');
});

router.get('/profile', authController.requireAuth, (req, res) => {
    res.render('profile', {
        user: req.user
    });
});

module.exports = router;