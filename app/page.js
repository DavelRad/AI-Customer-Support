'use client'

import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar, Menu, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles';
import { ThemeProvider, createTheme } from '@mui/material/styles'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from './utils/firebase-config'
import { useRouter } from 'next/navigation';
import { create } from '@mui/material/styles/createTransitions';
import UserProfile from './components/UserProfile';
import LLMInfo from './components/LLMInfo';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d',
    },
    primary: {
      main: '#2EBAFF',
    },
    secondary: {
      main: '#950606',
    },
  },
});

//From MUI documentation
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


export default function Home() {
  // State for the messages in the chat
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your personal assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [currentModel, setCurrentModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [user, setUser] = useState(null)
  const [threadId, setThreadId] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadCurrentThread(user.uid)
      } else {
        setUser(null);
        router.push('/authentication/login');
      }
    });
  
    return () => unsubscribe();
  }, [router]);

  const loadCurrentThread = useCallback(async (userId) => {
    const threadId = localStorage.getItem('currentThreadId')
    if (threadId) {
      setThreadId(threadId)
      const messagesRef = collection(db, 'users', userId, 'threads', threadId, 'messages')
      const q = query(messagesRef, orderBy('timestamp', 'asc'))
      const querySnapshot = await getDocs(q)
      const loadedMessages = querySnapshot.docs.map(doc => doc.data())
      setMessages(loadedMessages)
    } else {
      createNewThread(userId, db, setThreadId, setMessages)
    }
  }, [setThreadId, setMessages])

  const createNewThread = async (userId, db, setThreadId, setMessages) => {
    const newThreadRef = await addDoc(collection(db, 'users', userId, 'threads'), {
      createdAt: new Date()
    })
    setThreadId(newThreadRef.id)
    localStorage.setItem('currentThreadId', newThreadRef.id)
    const initialMessage = {
      role: 'assistant',
      content: "Hi! I'm your personal assistant. How can I help you today?",
      timestamp: new Date()
    }
    setMessages([initialMessage])
    await addDoc(collection(db, 'users', userId, 'threads', newThreadRef.id, 'messages'), initialMessage)
  }
 
  //File Uploading
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE_KB = 40;
  // Function to handle file change
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.size > MAX_FILE_SIZE_KB * 1024) {
      alert(`File size exceeds ${MAX_FILE_SIZE_KB} KB`);
      return;
    } else {
      setFile(selectedFile);
      setFileName(selectedFile ? selectedFile.name : '');
    }
    
  };

  // Function to upload a file
  const uploadFile = async () => {
    if (!file || !user) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.uid);

    try {
        const token = await user.getIdToken()
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (response.ok) {
            console.log('File uploaded successfully');
            setFile(null);
            setFileName(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            alert('File uploaded successfully');
        } else {
            console.error('File upload failed');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
    } finally {
        setUploading(false);
    }
  };

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true)
    setMessage('')
    
    const newUserMessage = { role: 'user', content: message, timestamp: new Date() }
    const newAssistantMessage = { role: 'assistant', content: '', model: currentModel, timestamp: new Date() }

    setMessages((prevMessages) => [
      ...prevMessages,
      newUserMessage,
      newAssistantMessage
    ])
  
    try {
      await addDoc(collection(db, 'users', user.uid, 'threads', threadId, 'messages'), newUserMessage)
      const token = await user.getIdToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          userId: user.uid,
        }),
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      let accumulatedContent = ''
      let newModel = currentModel
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsedLine = JSON.parse(line)
              if (parsedLine.model) {
                newModel = parsedLine.model
              } else {
                accumulatedContent += parsedLine
              }
            } catch (e) {
              accumulatedContent += line
            }
          }
        }
  
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages]
          newMessages[newMessages.length - 1].content = formatContent(accumulatedContent);
          newMessages[newMessages.length - 1].model = newModel;
          return newMessages
        })
        setCurrentModel(newModel)
      }

      await addDoc(collection(db, 'users', user.uid, 'threads', threadId, 'messages'), {
        ...newAssistantMessage,
        content: accumulatedContent,
      });

    } catch (error) {
      console.error('Error:', error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later.", model: currentModel },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const startNewThread = useCallback(() => {
    if (user) {
      setMessages([]) // Clear existing messages
      createNewThread(user.uid, db, setThreadId, setMessages)
    }
  }, [user, db, setThreadId, setMessages])

  // Function to handle the enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  // Help formatting the content
  const formatContent = (content) => {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\* /g, '• ');
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/authentication/login');
    }).catch((error) => {
      console.error('Logout failed:', error);
    });
  };


  return (
    <ThemeProvider theme={darkTheme}>
      {/* main page */}
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        position="relative"
      >
        {user && <UserProfile user={user} onLogout={handleLogout} />}
        
        {/* chat box */}
        <Box
          width="1000px"
          height="700px"
          borderRadius="20px"
          overflow="hidden"
          position="relative"
          bgcolor="background.paper"
          sx={{
            boxShadow: '0 0 20px rgba(255,255,255,0.3)',
          }}
        >
          {/* stack for the chat messages and input */}
          <Stack
            direction="column"
            height="100%"
            spacing={2}
          >
            {/* stack for mess */}
            <Stack
              direction="column"
              spacing={2}
              flexGrow={1}
              overflow="auto"
              p={3}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  display="flex"
                  flexDirection="column"
                  alignItems={
                    message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                >
                  {message.role === 'assistant' && <LLMInfo model={message.model} />}
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? 'primary.main'
                        : 'secondary.main'
                    }
                    color="white"
                    borderRadius={5}
                    p={3.5}
                    m={0.5}
                    maxWidth="70%"
                    sx={{
                      boxShadow: '0 0 10px rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 0 15px rgba(255,255,255,0.4)',
                      },
                      '& ul': {
                        paddingLeft: '20px',
                        margin: 0,
                      },
                      '& li': {
                        marginBottom: '5px',
                      },
                    }}
                  >
                    <div
                        dangerouslySetInnerHTML={{ __html: message.content }}
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
            {/* stack for input */}
            <Stack direction="row" spacing={2} p={2} bgcolor="background.default" alignItems="flex-end">
              <Box
                sx={{
                  flexGrow: 1,
                  position: 'relative',
                  maxHeight: '150px', 
                }}
              >
                <TextField
                  multiline
                  maxRows={7}
                  label="Message"
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-root': {
                      maxHeight: '150px', 
                      overflowY: 'auto',
                    },
                    '& .MuiInputLabel-root': {
                      background: 'background.default',
                      padding: '0 4px',
                    },
                  }}
                />
              </Box>
              <Button
                variant="contained"
                onClick={sendMessage}
                disabled={isLoading}
                sx={{ height: '50px' }} // Increased height to match TextField
              >
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
              {/* Uploading Button */}
              <Button
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
                sx={{ height: '50px',
                      width:'150px', 
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',}} 
                >
                <Box
                  sx={{
                    flexGrow: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  >
                  {fileName || 'Add Docs (Max 40 KB)'}
                </Box>
                <VisuallyHiddenInput type="file"
                ref={fileInputRef}
                onChange={handleFileChange} />
              </Button>

              <Button
                onClick={uploadFile}
                variant='contained'
                sx={{ height: '50px' }}
                disabled = {uploading}
                >
                {uploading ? <CircularProgress size={24} /> : 'Upload'}
              </Button>
              {/* New Thread button */}
              <Button
                variant="contained"
                onClick={startNewThread}
                sx={{ height: '50px' }}
              >
                New Thread
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}