'use client'

import React, {useState} from 'react'
import { auth } from '../../utils/firebase-config'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
import { useRouter } from 'next/navigation'

export default function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter();

    const login = async (e) => {
        e.preventDefault()
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            console.log("Login Successful", userCredential.user)
            
            userCredential.user.getIdToken().then(token => {
                console.log("Token:", token)
                localStorage.setItem('token', token)
            })

            localStorage.removeItem('currentThreadId');

            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error) {
            console.log("Login failed:", error);
        }
    }

    const loginWithGmail = async () => {
        const provider = new GoogleAuthProvider()
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            console.log("Gmail Login Successful", user);

            user.getIdToken().then(token => {
                console.log("Token:", token);
                localStorage.setItem('token', token);
            });

            localStorage.removeItem('currentThreadId'); // Optional: Reset current thread for a new session

            router.push('/');
        } catch (error) {
            console.log("Gmail Login failed:", error);
        }
    }

    return (
        <div style={styles.container}>
            <h1>Login</h1>
            <form onSubmit={login} style={styles.form}>
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
                    Login
                </button>
            </form>
            <button onClick={loginWithGmail} style={styles.gmailButton}>
                Login with Gmail
            </button>
            <p>
                Don't have an account?{' '}
                <span style={styles.link} onClick={() => router.push('/authentication/signup')}>
                    Sign up here
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