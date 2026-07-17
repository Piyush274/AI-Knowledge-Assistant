import axios from "axios";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
})

// axios.get("/api/documents") is same as client.get("/documents")

//FastAPI backend can then extract and verify this token

// Before every request, Axios gives you the request configuration object.
client.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    // This ensures you only add the Authorization header when the user is logged in.
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // If null request is sent without an authenticationn header

    return config;

})

//biggest advantage of using an Axios instance with an interceptor is that you write the authentication logic once, and every request made through client automatically includes the JWT token if the user is logged in.

// React Component
//        │
//        ▼
// client.get("/documents")
//        │
//        ▼
// Axios Instance
// (baseURL = "/api")
//        │
//        ▼
// Request Interceptor
//        │
//        ├── Read token from localStorage
//        ├── If present, add:
//        │      Authorization: Bearer <token>
//        ▼
// Request becomes:
// GET /api/documents
//        │
//        ▼
// Vite Proxy
//        │
//        ▼
// GET http://localhost:8000/documents
//        │
//        ▼
// FastAPI Backend
//        │
//        ▼
// Response
//        │
//        ▼
// Axios
//        │
//        ▼
// React Component
export default client;

