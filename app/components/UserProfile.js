import React, { useState } from 'react';
import { Box, Button, Stack, TextField, Typography, CircularProgress, Avatar, Menu, MenuItem } from '@mui/material'

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
        <Typography variant="body2" sx={{ mr: 2, color: 'white' }}>{user.email}</Typography>
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

export default UserProfile;
