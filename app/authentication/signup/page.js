'use client'

import React, { useState } from 'react'
import { auth, db } from '../../utils/firebase-config'
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Container, TextField, Button, Typography, Box, Link } from '@mui/material'
import Image from 'next/image'

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
        <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#1e1e1e', borderRadius: 2, boxShadow: 3, p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Image src="/images/myraTheMythWeaver_inPixio.png" alt="Myra the Myth Weaver" width={100} height={100} />
            </Box>

            <Typography variant="h4" component="h1" sx={{ color: '#ffffff', mb: 3 }}>
                Sign Up
            </Typography>

            <Box component="form" onSubmit={signup} sx={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', bgcolor: '#2b2b2b', p: 3, borderRadius: 2 }}>
                <TextField
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{
                        style: { color: '#ccc' },
                    }}
                    InputProps={{
                        style: { color: '#fff' },
                    }}
                />
                <TextField
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{
                        style: { color: '#ccc' },
                    }}
                    InputProps={{
                        style: { color: '#fff' },
                    }}
                />
                <Button type="submit" variant="contained" sx={{ mt: 2, bgcolor: '#0070f3', '&:hover': { bgcolor: '#005bb5' } }}>
                    Sign Up
                </Button>
            </Box>

            <Typography variant="body2" sx={{ mt: 2, color: '#ffffff' }}>
                Already have an account?{' '}
                <Link onClick={() => router.push('/authentication/login')} sx={{ color: '#0070f3', cursor: 'pointer' }}>
                    Login here
                </Link>
            </Typography>
        </Container>
    )
}