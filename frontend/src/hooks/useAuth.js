import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

// useState → Stores component state.
// useEffect → Runs code after the component renders.

export default function useAuth() {
    const navigate = useNavigate();

    //user stores the logged-in user, initally null
    const [user, setUser] = useState(null);

    //Tracks whether an API request is in progress.
    const [loading, setLoading] = useState(true);

    //Stores any login/signup error message.
    const [error, setError] = useState(null);

    //Check existing login - runs once after the component mounts
    useEffect(() => {
        //Get token from localstorage
        const token = localStorage.getItem("token");

        // Checks if the user has already logged in before.
        if (token) {
            setUser({ email: "authenticated" });
        }
        setLoading(false);
    }, []);
    //Empty dependency array ([]) means this effect runs only once.

    // Defines an asynchronous login function.
    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        //Creates URL-encoded form data instead of json with email and password it creates username=test@gmail.com&password=123456 
        const formData = new URLSearchParams();

        formData.append("username", email);
        formData.append("password", password);

        try {
            const response = await client.post("auth/login", formData);

            //Saves the JWT in the browser.
            localStorage.setItem("token", response.data.access_token);

            //Updates the logged-in user state.
            setUser({ email });
            navigate("/chat"); // after successful login it will redirect user to chat page
        } catch (error) {
            setError(error.response?.data?.detail || "Login failed");
        }
        // Stops loading after the request is complete.
        finally {
            setLoading(false);
        }
    };

    const signup = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            //Send json to backend
            await client.post("auth/signup", { email, password });

            //Automatically logs in the user after successful signup.
            await login(email, password);
        } catch (error) {
            setError(error.response?.data?.detail || "Signup failed");
            setLoading(false);
        }
    };

    const logout = () => {
        //Delete jwt from brower
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
    };

    return { user, loading, error, login, signup, logout };
}