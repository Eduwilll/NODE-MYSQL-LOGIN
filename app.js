const express = require("express"); //importando do modulo express para startar.
const path = require("path"); //importando path
const mysql = require("mysql");//importando mysql
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config({path:'./.env'})
//startando com a cost app.
const app = express();

//colocando os valores da coneceção mysql
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

//Definindo o public directory para usar CSS e/ou JavaScript
const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));// rodando no express

//parse url-encoded bodies (enviados pelo html form)
app.use(express.urlencoded({extended: false}));
//
app.use(express.json());
//inicializando o  cookieParser
app.use(cookieParser());

//Setando o templeta que vai ser usado
app.set('view engine', 'hbs');

//checando a conexao com MYSQL
db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("MYSQL Connected...");
    }
})

//Define Routes
app.use('/',require('./routes/pages.js'));
app.use('/auth', require('./routes/auth.js'))

//servidor executendo, funcao callback.
app.listen(5001, ()=> {
    console.log("Server started on Port 5000");
})