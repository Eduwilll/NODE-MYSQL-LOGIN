const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { promisify } = require('util');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.register = async (req, res) => {
    try {
        const { name, email, password, passwordConfirm } = req.body;

        // Validação backend
        if (!name || name.length < 3 || name.length > 50) {
            return res.render('register', { message: 'Nome deve ter entre 3 e 50 caracteres.' });
        }
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.render('register', { message: 'Digite um email válido.' });
        }
        if (!password || password.length < 6 || password.length > 32) {
            return res.render('register', { message: 'Senha deve ter entre 6 e 32 caracteres.' });
        }
        if (password !== passwordConfirm) {
            return res.render('register', { message: 'As senhas não são compatíveis.' });
        }

        db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
            if (error) {
                console.log(error);
                return res.render('register', {
                    message: 'Ocorreu um erro no registro'
                });
            }

            if (result.length > 0) {
                return res.render('register', {
                    message: 'Esse email já está cadastrado'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 8);

            db.query('INSERT INTO users SET ?', { name, email, password: hashedPassword }, (error, result) => {
                if (error) {
                    console.log(error);
                    return res.render('register', {
                        message: 'Ocorreu um erro no registro'
                    });
                }
                
                return res.render('register', {
                    message: 'Usuário Registrado com Sucesso'
                });
            });
        });
    } catch (error) {
        console.log(error);
    }
};

exports.login = async (req, res) => {
    try {
        console.log('Login attempt - Request body:', req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Login failed - Missing email or password');
            return res.status(400).render('login', {
                message: 'Por favor, forneça email e senha'
            });
        }

        // Convert callback to promise for better async handling
        const query = promisify(db.query).bind(db);
        
        console.log('Attempting database query for email:', email);
        const results = await query('SELECT * FROM users WHERE email = ?', [email]);
        console.log('Database query results:', results);
        
        if (!results || results.length === 0) {
            console.log('Login failed - User not found');
            return res.status(401).render('login', {
                message: 'Email ou senha incorretos'
            });
        }
        console.log(results[0].email)
        console.log( results[0].password)
        console.log('Comparing passwords...');
        const isPasswordValid = await bcrypt.compare(password, results[0].password);
        console.log('Password validation result:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('Login failed - Invalid password');
            return res.status(401).render('login', {
                message: 'Email ou senha incorretos'
            });
        }

        const id = results[0].Id;
        console.log('Creating JWT token for user ID:', id);
        const token = jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d'
        });

        const cookieOptions = {
            expires: new Date(
                Date.now() + (process.env.JWT_COOKIE_EXPIRES || 1) * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
        };

        console.log('Setting JWT cookie and redirecting to profile');
        res.cookie('jwt', token, cookieOptions);
        res.status(200).redirect('/profile');
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).render('login', {
            message: 'Erro interno do servidor'
        });
    }
};

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                if (error) {
                    console.log(error);
                    return next();
                }

                if (!result || result.length === 0) {
                    return next();
                }

                req.user = result[0];
                res.locals.user = result[0];
                return next();
            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        res.locals.user = null;
        return next();
    }
};

exports.requireAuth = async (req, res, next) => {
    console.log('Checking authentication...');
    if (req.cookies.jwt) {
        try {
            console.log('JWT cookie found, verifying...');
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            console.log('JWT decoded:', decoded);
            
            const query = promisify(db.query).bind(db);
            const result = await query('SELECT * FROM users WHERE Id = ?', [decoded.id]);
            console.log('User query result:', result);

            if (!result || result.length === 0) {
                console.log('No user found for ID:', decoded.id);
                return res.redirect('/login');
            }

            req.user = result[0];
            res.locals.user = result[0];
            console.log('Authentication successful for user:', result[0].name);
            return next();
        } catch (error) {
            console.error('JWT verification error:', error);
            return res.redirect('/login');
        }
    } else {
        console.log('No JWT cookie found');
        return res.redirect('/login');
    }
};

exports.logout = async (req, res) => {
    res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).redirect('/');
};