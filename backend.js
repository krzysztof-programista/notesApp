import express from 'express';
import pg from "pg";
import jwt from 'jsonwebtoken';
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

dotenv.config();

const db = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
});

const app = express();
const port = 8080;
const SECRET_KEY = process.env.SECRET_KEY;
const saltRounds = 10;


app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Logowanie
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    }

    try {
        const result = await db.query('SELECT id, username, password, is_activated FROM users WHERE username = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'Nieprawidłowy email.' });
        }

        const user = result.rows[0];

        if (user.is_activated === false) {
            return res.status(400).json({ message: 'Konto nie zostało jeszcze aktywowane. Kliknij w link w wiadomości email.' });
        }


        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Nieprawidłowe hasło.' });
        }

        const token = jwt.sign({ id: user.id, email: user.username }, SECRET_KEY, { expiresIn: '1h' });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username
            }
        });

    } catch (err) {
        console.error('Błąd podczas logowania:', err.stack);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

//Wysyłanie maili
async function sendActivationEmail(email, token) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
            secure: true,
            tls: {
                rejectUnauthorized: false,
            },
        });

        const activationLink = `http://localhost:8080/activate/${token}`;

        await transporter.sendMail({
            from: '"Aplikacja notatkowa" <yourapp@example.com>',
            to: email,
            subject: 'Aktywacja konta w aplikacji notatkowej',
            text: `Twój email został użyty do rejestracji konta.
             Kliknij w poniższy link, aby aktywować swoje konto: ${activationLink}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                    <h1 style="color: #4CAF50; text-align: center;">Aplikacja Notatkowa</h1>
                    <p style="font-size: 16px;">Cześć,</p>
                    <p style="font-size: 16px;">Dziękujemy za rejestrację w naszej aplikacji notatkowej! Aby zakończyć proces tworzenia konta, kliknij w poniższy przycisk, aby aktywować swoje konto:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${activationLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">Aktywuj konto</a>
                    </div>
                    <p style="font-size: 14px;">Jeśli powyższy przycisk nie działa, skopiuj i wklej poniższy link do swojej przeglądarki:</p>
                    <p style="font-size: 14px; word-wrap: break-word; color: #007BFF;">${activationLink}</p>
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="font-size: 12px; color: #555;">Jeśli nie rejestrowałeś(-aś) się w naszej aplikacji, zignoruj ten e-mail.</p>
                </div>
            `,
        });

    } catch (error) {
        console.error('Błąd podczas wysyłania e-maila aktywacyjnego:', error);
        throw new Error('Nie udało się wysłać e-maila aktywacyjnego.');
    }
}

//Walidacja hasła
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/;
    const hasDigit = /\d/;
    const hasSpecialChar = /[@$!%*?&]/;

    if (password.length < minLength) {
        return { valid: false, message: 'Hasło musi mieć co najmniej 8 znaków.' };
    }
    if (!hasUpperCase.test(password)) {
        return { valid: false, message: 'Hasło musi zawierać co najmniej jedną wielką literę.' };
    }
    if (!hasDigit.test(password)) {
        return { valid: false, message: 'Hasło musi zawierać co najmniej jedną cyfrę.' };
    }
    if (!hasSpecialChar.test(password)) {
        return { valid: false, message: 'Hasło musi zawierać co najmniej jeden znak specjalny (@, $, !, %, *, ?, &).' };
    }
    
    return { valid: true };
}

//Rejestracja
app.post('/register', async (req, res) => {
    const { email, password, passwordConfirm } = req.body;

    if (!email || !password || !passwordConfirm) {
        return res.status(400).json({ message: 'Email i hasło są wymagane.' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ message: 'Hasła muszą być identyczne.' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
    }

    try {
        const result = await db.query('SELECT id FROM users WHERE username = $1', [email]);

        if (result.rows.length > 0) {
            return res.status(400).json({ message: 'Użytkownik o podanym emailu już istnieje.' });
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertResult = await db.query(
            'INSERT INTO users (username, password, is_activated) VALUES ($1, $2, $3) RETURNING id, username, is_activated',
            [email, hashedPassword, false]
        );

        const user = insertResult.rows[0];

        const activationToken = jwt.sign({ id: user.id, email: user.username }, SECRET_KEY, { expiresIn: '1h' });

        sendActivationEmail(user.username, activationToken);

        return res.status(200).json({message: 'Email aktywacyjny został wysłany. Sprawdź swoją skrzynkę e-mailową, aby aktywować konto.'});
        

    } catch (err) {
        console.error('Błąd podczas rejestracji:', err);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

//Aktywacja konta
app.get('/activate/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decodedToken = jwt.verify(token, SECRET_KEY);

        const userId = decodedToken.id; 

        const result = await db.query('SELECT is_activated FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika.' });
        }

        const user = result.rows[0];
        if (user.is_activated) {
            return res.status(400).json({ message: 'Konto jest już aktywowane.' });
        }

        await db.query('UPDATE users SET is_activated = $1 WHERE id = $2', [true, userId]);

        return res.status(200).json({ message: 'Konto zostało pomyślnie aktywowane.' });
    } catch (err) {
        console.error('Błąd aktywacji konta:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Token wygasł. Poproś o nowy link aktywacyjny.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(400).json({ message: 'Nieprawidłowy token aktywacyjny.' });
        }

        return res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Middleware do weryfikacji JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Brak tokena uwierzytelniającego.' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Nieprawidłowy token.' });
        }

        req.user = user;
        next();
    });
};

// Pobieranie notatek użytkownika
app.get('/notes', authenticateJWT, async (req, res) => {
    try {
        const result = await db.query('SELECT id, title, note_text FROM notes WHERE user_id = $1', [req.user.id]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error during fetching notes:', err.stack);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

//Dodawanie nowej notatki
app.post('/newNote', authenticateJWT, async (req, res) => {
    const { title, content } = req.body;

    try {
        const result = await db.query('INSERT INTO notes (user_id, note_text, title) VALUES ($1,$2,$3) RETURNING id', [req.user.id, content, title]);

        res.status(200).json({
            message: 'Notatka została dodana pomyślnie.',
            noteId: result.rows[0].id,
        });
    } catch (err) {
        console.error('Error during adding note:', err.stack);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

//Usuwanie notatki
app.delete('/deleteNote', authenticateJWT, async (req, res) => {
    const id = req.body.id;
    try {
        const result = await db.query('DELETE FROM notes WHERE id = $1', [id]);

        res.status(200).json({
            message: 'Notatka została usunięta pomyślnie.',
        });
    } catch (err) {
        console.error('Error during deleting note:', err.stack);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

//Edycja notatki
app.patch('/editNote', authenticateJWT, async (req, res) => {
    const { id, title, content } = req.body;
    try {
        const result = await db.query(
            'UPDATE notes SET title = $1, note_text = $2 WHERE id = $3',
            [title, content, id]
        );

        res.status(200).json({
            message: 'Notatka została zaktualizowana pomyślnie.',
        });
    } catch (err) {
        console.error('Error during updating note:', err.stack);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// (async () => {
//     try {
//       await sendActivationEmail('krzysztof.gniadzik@gmail.com', '12345');
//       console.log('E-mail wysłany pomyślnie!');
//     } catch (error) {
//       console.error('Błąd:', error.message);
//     }
//   })();


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
