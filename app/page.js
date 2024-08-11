'use client'

import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import React, { useState, useRef, useEffect } from 'react'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1e1e1e',
      paper: '#2d2d2d',
    },
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// LLM info component
// Updated LLM info component with rounded logo
const LLMInfo = () => (
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
      src="/images/llama-logo.png"
      alt="LLama Logo"
      sx={{
        width: 16,
        height: 16,
        marginRight: 1,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
      LLama-3.1-8b-instruct
    </Typography>
  </Box>
);

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm the Headstarter support assistant. How can I help you today?",
    },
  ])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

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
      { role: 'assistant', content: '' },
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
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk
  
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages]
          newMessages[newMessages.length - 1].content = accumulatedContent
          return newMessages
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="background.default"
      >
        <Box
          width="500px"
          height="700px"
          borderRadius="20px"
          overflow="hidden"
          boxShadow="0 0 20px rgba(0,0,0,0.3)"
          position="relative"
          bgcolor="background.paper"
        >
          <Stack
            direction="column"
            height="100%"
            spacing={2}
          >
            <Stack
              direction="column"
              spacing={2}
              flexGrow={1}
              overflow="auto"
              p={2}
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
                  {message.role === 'assistant' && <LLMInfo />}
                  <Box
                    bgcolor={
                      message.role === 'assistant'
                        ? 'primary.main'
                        : 'secondary.main'
                    }
                    color="white"
                    borderRadius={10}
                    p={3.5}
                    maxWidth="70%"
                  >
                    <Typography>{message.content}</Typography>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Stack>
            <Stack direction="row" spacing={2} p={2} bgcolor="background.default">
              <TextField
                label="Message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                variant="outlined"
              />
              <Button variant="contained" onClick={sendMessage} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}