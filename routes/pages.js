const express = require('express');

const router = express.Router();

//rendernizando a pagina Home
router.get('/',(req, res) => {
    res.render('index');
})

//rendernizando a pagina Register
router.get('/register',(req, res) => {
    res.render('register');
})

//rendernizando a pagina de Login
router.get('/login',(req, res) => {
    res.render('login');
})

router.get('/profile',(req, res) => {
    res.render('profile');
})

module.exports = router;