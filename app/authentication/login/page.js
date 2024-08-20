'use client'

import React, {useState} from 'react'
import { auth } from '../../utils/firebase-config'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithRedirect } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Container, TextField, Button, Typography, Box, Link } from '@mui/material'

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
        <Container maxWidth="sm" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#1e1e1e', borderRadius: 2, boxShadow: 3, p: 3 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <img src="/images/byteTheTechOwl_inPixio.png" alt="Byte the Tech Owl" style={{ width: '100px', height: 'auto' }} />
            </Box>

            <Typography variant="h4" component="h1" sx={{ color: '#ffffff', mb: 3 }}>
                Login
            </Typography>

            <Box component="form" onSubmit={login} sx={{ width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', bgcolor: '#2b2b2b', p: 3, borderRadius: 2 }}>
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
                    Login
                </Button>
            </Box>

            <Typography variant="body2" sx={{ mt: 2, color: '#ffffff' }}>
                Don't have an account?{' '}
                <Link onClick={() => router.push('/authentication/signup')} sx={{ color: '#0070f3', cursor: 'pointer' }}>
                    Sign up here
                </Link>
            </Typography>
        </Container>
    )
}