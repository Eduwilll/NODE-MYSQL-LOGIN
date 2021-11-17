const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

//rendernizando a pagina Home
router.get('/',authController.isLoggedIn,(req, res) => {
    res.render('index',{
        user: req.user
    });
})

//rendernizando a pagina Register
router.get('/register',(req, res) => {
    res.render('register');
})

//rendernizando a pagina de Login
router.get('/login',(req, res) => {
    res.render('login');
})

//rendernizando a pagina de Profile
router.get('/profile',authController.isLoggedIn, (req, res) => {

    if (req.user) {
        res.render('profile', {
            user: req.user
        });
    } else {
        res.redirect('/login')
    }

})

module.exports = router;