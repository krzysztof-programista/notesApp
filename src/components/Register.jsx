import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Register(props) {

    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
        passwordConfirm: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setCredentials((prevValue) => ({
            ...prevValue,
            [name]: value,
        }));
        setMessage("");
        setErrorMessage("");
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prevValue) => !prevValue);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const response = await axios.post("http://localhost:8080/register", {
                email: credentials.email,
                password: credentials.password,
                passwordConfirm: credentials.passwordConfirm,
            });

            if (response.status === 200) {
                setMessage(response.data.message);
                setCredentials({ email: "", password: "", passwordConfirm: "" });
            }
            //navigate("/");

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage("Błąd rejestracji. Spróbuj ponownie.");
            }
        }
    };

    return (
        <div>
            <Header />
            <div className="form-container">
                <h1>Rejestracja</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        <p>Email</p>
                        <input type="email" name="email" value={credentials.email} onChange={handleInputChange} required />
                    </label>
                    <label>
                        <p>Hasło</p>
                        <input type={showPassword ? "text" : "password"} name="password" value={credentials.password} onChange={handleInputChange} required />
                    </label>
                    <label>
                        <p>Powtórz hasło</p>
                        <input type={showPassword ? "text" : "password"} name="passwordConfirm" value={credentials.passwordConfirm} onChange={handleInputChange} required />
                    </label>
                    <div className="password-toggle">
                        <input type="checkbox" id="showPassword" checked={showPassword} onChange={togglePasswordVisibility} />
                        <label for="showPassword">Pokaż hasło</label>
                    </div>
                    <div>
                        <button type="submit">Zarejestruj się</button>
                    </div>
                </form>
                {message && <p className="activation-message">{message}</p>}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <p className="form-link">
                    Masz już konto? <Link to="/login">Zaloguj się</Link>
                </p>
            </div>
            <Footer />
        </div>
    );
}

export default Register;