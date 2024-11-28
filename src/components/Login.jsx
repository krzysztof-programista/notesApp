import React, { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login(props) {

    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setCredentials((prevValue) => ({
            ...prevValue,
            [name]: value,
        }));
        setErrorMessage("");
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prevValue) => !prevValue);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            const response = await axios.post("http://localhost:8080/login", {
                email: credentials.email,
                password: credentials.password,
            });

            if (response.data.token) {
                props.setToken(response.data.token);
                props.onLogin(response.data.user);
                navigate("/");
            } 
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                setErrorMessage(error.response.data.message);
            } else {
                setErrorMessage("Błąd logowania. Spróbuj ponownie.");
            }
        }
    };

    return (
        <div>
            <Header />
            <div className="form-container">
                <h1>Logowanie</h1>
                <form onSubmit={handleSubmit}>
                    <label>
                        <p>Email</p>
                        <input type="email" name="email" value={credentials.email} onChange={handleInputChange} required/>
                    </label>
                    <label>
                        <p>Hasło</p>
                        <input type={showPassword ? "text" : "password"} name="password" value={credentials.password} onChange={handleInputChange} required/>
                    </label>
                    <div className="password-toggle">
                        <input type="checkbox" id="showPassword" checked={showPassword} onChange={togglePasswordVisibility} />
                        <label for="showPassword">Pokaż hasło</label>
                    </div>
                    <div>
                        <button type="submit">Zaloguj się</button>
                    </div>
                </form>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <p className="form-link">
                    Nie masz konta? <Link to="/register">Zarejestruj się</Link>
                </p>
            </div>
            <Footer />
        </div>
    );
}

export default Login;
//shift+alt+f do wyrównania treści