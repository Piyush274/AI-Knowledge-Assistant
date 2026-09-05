import axios from "axios";

const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
})

// axios.get("/api/documents") is same as client.get("/documents")

//FastAPI backend can then extract and verify this token

let pendingRequestsCount = 0;
let slowRequestTimer = null;

function notifySlowRequest(isSlow) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("render-server-status", { detail: { isWaking: isSlow } }));
    }
}

// Request Interceptor: Attach JWT token and track request latency
client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    pendingRequestsCount++;
    if (pendingRequestsCount === 1) {
        // If request takes longer than 2.5s, signal that the Render server is likely cold-starting/waking up
        slowRequestTimer = setTimeout(() => {
            notifySlowRequest(true);
        }, 2500);
    }

    return config;
});

// Response Interceptor: Handle 401 Unauthorized and dismiss wake-up spinner
client.interceptors.response.use(
    (response) => {
        pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
        if (pendingRequestsCount === 0) {
            clearTimeout(slowRequestTimer);
            notifySlowRequest(false);
        }
        return response;
    },
    (error) => {
        pendingRequestsCount = Math.max(0, pendingRequestsCount - 1);
        if (pendingRequestsCount === 0) {
            clearTimeout(slowRequestTimer);
            notifySlowRequest(false);
        }

        // Handle 401 Unauthorized (Expired or invalid token)
        if (error.response && error.response.status === 401) {
            // Clear invalid session state from localStorage
            localStorage.removeItem("token");
            localStorage.removeItem("user_email");
            localStorage.removeItem("cached_sessions");
            localStorage.removeItem("cached_documents");

            // Redirect to login page if user is currently on an authenticated route
            if (typeof window !== "undefined") {
                const pathname = window.location.pathname;
                if (pathname !== "/" && !pathname.startsWith("/login")) {
                    window.location.href = "/?session_expired=true";
                }
            }
        }

        return Promise.reject(error);
    }
);

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
