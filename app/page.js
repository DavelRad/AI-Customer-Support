'use client'

import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar, Menu, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles';
import { ThemeProvider, createTheme } from '@mui/material/styles'
import React, { useState, useRef, useEffect } from 'react'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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


// LLM info component (tab on top of the chatbots messages)
// Updated LLM info component with rounded logo
const LLMInfo = ({ model }) => {
  const modelInfo = {
    'meta-llama/llama-3.1-8b-instruct:free': {
      name: 'LLama-3.1-8b-instruct',
      logo: '/images/llama-logo.png'
    },
    'openchat/openchat-7b:free': {
      name: 'OpenChat 3.5',
      logo: '/images/openchat-logo.png'
    },
    'gryphe/mythomist-7b:free': {
      name: 'MythoMist-7b',
      logo: '/images/mythomist-logo.png'
    }
  };

  const { name, logo } = modelInfo[model] || modelInfo['meta-llama/llama-3.1-8b-instruct:free'];

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '3px 8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
        width: 'fit-content',
      }}
    >
      <Box
        component="img"
        src={logo}
        alt={`${name} Logo`}
        sx={{
          width: 16,
          height: 16,
          marginRight: 1,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
      <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
        {name}
      </Typography>
    </Box>
  );
};

const UserProfile = ({ user, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', alignItems: 'center' }}>
      <Typography variant="body2" sx={{ mr: 2 }}>{user.email}</Typography>
      <Avatar
        onClick={handleClick}
        sx={{ cursor: 'pointer', bgcolor: 'primary.main' }}
      >
        {user.email[0].toUpperCase()}
      </Avatar>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </Box>
  );
};

export default function Home() {
  // State for the messages in the chat
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const [currentModel, setCurrentModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        router.push('/authentication/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

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
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
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
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: '', model: currentModel },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
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
    const auth = getAuth();
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
            </Stack>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}