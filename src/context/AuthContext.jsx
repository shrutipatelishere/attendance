import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Keep loading true while we fetch the role
                setLoading(true);
                let role = 'Staff';
                let name = firebaseUser.displayName || firebaseUser.email.split('@')[0];

                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        role = data.role || 'Staff';
                        if (data.name) name = data.name;
                    }
                } catch (e) {
                    console.error('Failed to fetch user role:', e);
                }

                if (firebaseUser.email && firebaseUser.email.toLowerCase().includes('admin')) {
                    role = 'Admin';
                }

                setCurrentUser({ uid: firebaseUser.uid, email: firebaseUser.email, name, role });
                setUserRole(role);
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    async function login(email, password) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return cred.user;
    }

    function signup() {
        return Promise.reject(new Error('Please use Admin panel to create new users'));
    }

    async function logout() {
        await signOut(auth);
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
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
