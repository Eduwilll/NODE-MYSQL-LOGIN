const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config({ path: './.env'});

const app = express();

// Configuração do Handlebars

app.set('view engine', 'hbs');

// Configuração dos middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // Para servir arquivos estáticos

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

db.connect((error) => {
    if(error) {
        console.log(error);
    } else {
        console.log("MySQL Connected...");
    }
});

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));


app.listen(5000, () => {
    console.log("Server started on Port 5000 link: http://localhost:5000");
});
