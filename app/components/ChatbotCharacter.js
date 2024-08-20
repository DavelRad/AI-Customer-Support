import React from 'react'
import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar, Menu, MenuItem } from '@mui/material'

const characterImages = {
    'meta-llama/llama-3.1-8b-instruct:free': '/images/laniTheLlama_inPixio.png',
    'openchat/openchat-7b:free': '/images/byteTheTechOwl_inPixio.png',
    'gryphe/mythomist-7b:free': '/images/myraTheMythWeaver_inPixio.png'
  };
  
const ChatbotCharacter = ({ model }) => {
    console.log('Current Model:', model); // Add this line for debugging
    return (
        <Box
            sx={{
                position: 'absolute',
                top: '8%',  // Adjust this to make the character peek out from the top
                left: '50%',   // Position all characters at 50% horizontally
                transform: 'translateX(-50%)',  // Center the character horizontally
                zIndex: 1,  // Ensure the character is above the chatbox and other content
            }}
        >
            <img src={characterImages[model]} alt="Character Mascot" style={{ width: '100px', height: 'auto' }} />
        </Box>
    );
};

export default ChatbotCharacter