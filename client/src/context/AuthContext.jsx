import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('user');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to parse user from local storage", e);
            localStorage.removeItem('user'); // Clean up corrupt data
            return null;
        }
    });

    // Verification Effect
    useEffect(() => {
        const verifySession = async () => {
            if (!user) return;
            try {
                const res = await fetch('/api/me', {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!res.ok) {
                    console.warn("Session invalid - logging out");
                    logout();
                } else {
                    // Update user data (e.g. departmentName)
                    const data = await res.json();
                    console.log("[AuthContext] verifySession data:", data);
                    if (JSON.stringify(data) !== JSON.stringify(user)) {
                        setUser(data);
                        localStorage.setItem('user', JSON.stringify(data));
                    }
                }
            } catch (err) {
                console.error("Session verification failed", err);
            }
        };
        verifySession();
    }, []); // Run once on mount

    const registerOrg = async (data) => {
        try {
            const isFormData = data instanceof FormData;
            const options = {
                method: 'POST',
                body: isFormData ? data : JSON.stringify(data)
            };

            if (!isFormData) {
                options.headers = { 'Content-Type': 'application/json' };
            }

            const res = await fetch('/api/auth/register-org', options);
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const responseData = await res.json();
                if (res.ok) {
                    return { success: true, userId: responseData.userId };
                } else {
                    return { success: false, message: responseData.message || "Registration failed" };
                }
            } else {
                const text = await res.text();
                console.error("Non-JSON Response:", text);
                return { success: false, message: `Server Error (${res.status}): Please check console for details.` };
            }
        } catch (err) {
            console.error("Org Registration failed:", err);
            return { success: false, message: "Registration failed: " + err.message };
        }
    };

    // Legacy register (Member invite mostly now)
    const register = async (username, password) => {
        console.warn("Use registerOrg for new Orgs or Admin add user flow");
        return { success: false, message: "Use Organization Registration" };
    };

    const login = async (email, password, departmentName) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, departmentName })
            });

            if (res.ok) {
                const userData = await res.json();
                console.log("[AuthContext] Login successful. UserData:", userData);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('userId', userData.id); // For legacy components if any
                return true;
            } else if (res.status === 400 || res.status === 401) {
                // If special message exists, we could return it, but for now let's just return false 
                // and let the UI handle the generic "Check credentials" error.
                return false;
            }
            return false;
        } catch (err) {
            console.error("Login failed:", err);
            return false;
        }
    };

    const loginDemo = async () => {
        try {
            const res = await fetch('/api/auth/demo', { method: 'POST' });
            if (res.ok) {
                const userData = await res.json();
                console.log("[AuthContext] Demo Login successful:", userData);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Demo login failed:", err);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        // Force redirect to login page
        window.location.href = '/login';
    };

    // Switch to a different department
    const switchDepartment = async (departmentId) => {
        try {
            const res = await apiCall(`/api/departments/switch/${departmentId}`, {
                method: 'POST'
            });
            if (res && res.ok) {
                const data = await res.json();
                // Update user with new department
                const updatedUser = {
                    ...user,
                    departmentId: data.departmentId,
                    departmentName: data.departmentName
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Department switch failed:", err);
            return false;
        }
    };

    // Change theme preference
    const changeTheme = async (theme) => {
        try {
            const res = await apiCall('/api/users/theme', {
                method: 'PUT',
                body: JSON.stringify({ theme })
            });
            if (res && res.ok) {
                const updatedUser = { ...user, preferredTheme: theme };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Theme change failed:", err);
            return false;
        }
    };

    // Centralized API Wrapper
    const apiCall = async (endpoint, options = {}) => {
        if (!user) {
            console.warn("[API] Call aborted - No user in context");
            return null;
        }

        const headers = { ...options.headers, 'Authorization': `Bearer ${user.token}` };
        if (options.body && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const res = await fetch(endpoint, { ...options, headers });

            if (res.status === 401) {
                console.error(`[API] 401 Unauthorized from ${endpoint}. Auto-logging out.`);
                logout();
                window.location.href = '/login';
                return null;
            }
            return res;
        } catch (err) {
            console.error("[API] Fetch Error:", err);
            throw err;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            register,
            registerOrg,
            apiCall,
            switchDepartment,
            changeTheme,
            loginDemo
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
