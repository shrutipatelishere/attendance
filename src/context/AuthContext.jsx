import React, { useContext, useState, useEffect, createContext } from "react";
import { initializeStore, login as localLogin, logout as localLogout, getCurrentUser } from "../localStore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize demo data on first load
    useEffect(() => {
        initializeStore();

        // Check if user is already logged in
        const savedUser = getCurrentUser();
        if (savedUser) {
            setCurrentUser(savedUser);
            // Determine role - Admin if email contains 'admin' or role is Admin
            let role = savedUser.role || 'Staff';
            if (savedUser.email && savedUser.email.toLowerCase().includes('admin')) {
                role = 'Admin';
            }
            setUserRole(role);
        }
        setLoading(false);
    }, []);

    // Login
    function login(email, password) {
        return new Promise((resolve, reject) => {
            try {
                const user = localLogin(email, password);

                // Determine role
                let role = user.role || 'Staff';
                if (user.email && user.email.toLowerCase().includes('admin')) {
                    role = 'Admin';
                }

                setCurrentUser(user);
                setUserRole(role);
                resolve(user);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Signup - creates a new user (for demo, just add to store)
    function signup(email, password, name = '', role = 'Staff') {
        return new Promise((resolve, reject) => {
            try {
                // For demo, we'll handle this through MemberManager
                // This is just a placeholder for compatibility
                reject(new Error('Please use Admin panel to create new users'));
            } catch (error) {
                reject(error);
            }
        });
    }

    // Logout
    function logout() {
        return new Promise((resolve) => {
            localLogout();
            setCurrentUser(null);
            setUserRole(null);
            resolve();
        });
    }

    const value = {
        currentUser,
        userRole,
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value} >
            {!loading && children}
        </AuthContext.Provider >
    );
}
