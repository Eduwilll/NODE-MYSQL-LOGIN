const mysql = require("mysql");//importando mysql
const jwt = require("jsonwebtoken");//importando jwt
const bcrypt = require("bcryptjs");//importando bcrypt
const {promisify} = require ('util');//importando promisify

//colocando os valores da coneceção mysql
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

//Funcão para registrar o user
exports.register = (req,res) => {
    console.log(req.body);

    const {name, email, password, passwordConfirm} = req.body;

    db.query("SELECT email FROM users WHERE email = ?", [email], async (error, result) => {

        //Checando erros e redudancia
        if(error) {
            console.log(error);
        }
        if(result.length > 0) {
            return res.render('register', {
                message: 'Esse email já está cadastrado'
            })
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'A senha não compativeis'
            });
        }

        //criptogrando a senha 
        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        //inserindo os dados no banco de dados
        db.query('INSERT INTO users SET ?', {name: name, email:email, password:hashedPassword}, (error, result) => {
            if(error){
                console.log(error)
            } else {
                return res.render('register', {
                    message: 'Usuário Registrado'
                })
            }
        })
    });

}

//funcao para logar o user 
exports.login = async (req, res) => {

    //codicoes da para logar o user
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).render('login', {
                message: 'Digite o email e a senha'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
            console.log(results);
            if(!results || !(await bcrypt.compare(password,results[0].password))){
                res.status(401).render('login', {
                    message: 'Email ou senha está incorreta'
                })
            } else {
                const id = results[0].id;
                //criando token para a session
                const token = jwt.sign({id: id},process.env.JWT_SECRET,{
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("the token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000 //
                    ),
                    httpOnly: true
                }
                //setando o cookie no browser
                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect('/');

            }
        })

    } catch (error) {
        console.log(error)
    }

}


exports.isLoggedIn = async(req, res, next) => {
    console.log(req.cookies);
    if(req.cookies.jwt) {
        try {
            //1)verificar o token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt,
                    process.env.JWT_SECRET
            );
            
            console.log(decoded);
         //2)check se o usuário existe 
            db.query('SELECT * FROM users WHERE id = ?',[decoded.id],(error,result) => {
                console.log(result);

                if(!result) {
                    return next();
                } 

                req.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
}
//
exports.logout = async(req, res) => {
    //sobrescrevendo o cookie
    res.cookie('jwt', 'logout',{
        expires: new Date(Date.now() + 2*1000), //cookie expiration time
        httpOnly: true
    })
    res.status(200).redirect('/');//redirecionando o user para home
}

