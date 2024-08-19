import React from 'react';
import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar, Menu, MenuItem } from '@mui/material'

const LLMInfo = ({ model }) => {
    const modelInfo = {
      'meta-llama/llama-3.1-8b-instruct:free': {
        name: 'Lani the Llama',
        logo: '/images/llama-logo.png'
      },
      'openchat/openchat-7b:free': {
        name: 'Byte the Tech Owl',
        logo: '/images/openchat-logo.png'
      },
      'gryphe/mythomist-7b:free': {
        name: 'Myra the Myth Weaver',
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

export default LLMInfo;
