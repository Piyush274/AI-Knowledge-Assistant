import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

export default function useAuth() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedEmail = localStorage.getItem("user_email") || "User";

        if (token) {
            setUser({ email: savedEmail });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        try {
            const response = await client.post("auth/login", formData);
            localStorage.setItem("token", response.data.access_token);
            localStorage.setItem("user_email", email);

            setUser({ email });
            navigate("/chat");
        } catch (error) {
            setError(error.response?.data?.detail || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            await client.post("auth/signup", { email, password });
            await login(email, password);
        } catch (error) {
            setError(error.response?.data?.detail || "Signup failed");
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_email");
        setUser(null);
        navigate("/");
    };

    return { user, loading, error, login, signup, logout };
}