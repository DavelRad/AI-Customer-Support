'use client'

import React, { useState } from 'react'
import { auth } from '../../utils/firebase-config'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function Signup() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter();

    const signup = (e) => {
        e.preventDefault()
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("Signup Successful", userCredential.user)
                
                userCredential.user.getIdToken().then(token => {
                    console.log("Token:", token)
                    localStorage.setItem('token', token)
                })
                router.push('/') // Redirect to home page after signup
            })
            .catch((error) => {
                console.log("Signup failed:", error)
            })
    }

    const signupWithGmail = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Gmail Signup Successful", result.user)
                
                result.user.getIdToken().then(token => {
                    console.log("Token:", token)
                    localStorage.setItem('token', token)
                })
                router.push('/') // Redirect to home page after signup
            })
            .catch((error) => {
                console.log("Gmail Signup failed:", error)
            })
    }

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