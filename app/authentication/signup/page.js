'use client'

import React, { useState } from 'react'
import { auth, db } from '../../utils/firebase-config'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function Signup() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter();

    const signup = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log("Signup Successful", user);

            // Store email and UUID in Firestore
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                email: user.email,
                uuid: user.uid
            });

            user.getIdToken().then(token => {
                console.log("Token:", token);
                localStorage.setItem('token', token);
            });

            localStorage.removeItem('currentThreadId');

            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error) {
            console.log("Signup failed:", error);
        }
    };

    const signupWithGmail = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            console.log("Gmail Signup Successful", user);

            // Store email and UUID in Firestore
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                email: user.email,
                uuid: user.uid
            });

            user.getIdToken().then(token => {
                console.log("Token:", token);
                localStorage.setItem('token', token);
            });

            router.push('/');
        } catch (error) {
            console.log("Gmail Signup failed:", error);
        }
    };

    return (
        <div style={styles.container}>
            <h1>Sign Up</h1>
            <form onSubmit={signup} style={styles.form}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    style={styles.input}
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>
                    Sign Up
                </button>
            </form>
            <button onClick={signupWithGmail} style={styles.gmailButton}>
                Sign Up with Gmail
            </button>
            <p>
                Already have an account?{' '}
                <span style={styles.link} onClick={() => router.push('/authentication/login')}>
                    Login here
                </span>
            </p>
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
    },
    input: {
        marginBottom: '10px',
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    button: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#0070f3',
        color: '#fff',
        cursor: 'pointer',
        marginBottom: '10px',
    },
    gmailButton: {
        padding: '10px',
        fontSize: '16px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#db4437',
        color: '#fff',
        cursor: 'pointer',
        width: '300px',
        marginBottom: '10px',
    },
    link: {
        color: '#0070f3',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
};