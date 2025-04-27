"use client";

import { useState } from "react";
import { Box, Typography, TextField, IconButton, InputAdornment, Paper, Avatar, Button, useTheme } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LanguageIcon from '@mui/icons-material/Language';

export default function ChatSupportPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [message, setMessage] = useState("");

  const conversations = [
    { name: "Naiza Albina", lastMessage: "Hi, I’d like to check...", time: "4:30pm", unread: 3 },
    { name: "Curtis C", lastMessage: "How are you today?", time: "5:30pm", unread: 0 },
    { name: "Allen C", lastMessage: "Good day! I'm still...", time: "Thu", unread: 2 },
    { name: "Francis S", lastMessage: "Hi there! I haven't...", time: "Wed", unread: 0 },
    { name: "John M", lastMessage: "Can you help me...", time: "Tue", unread: 6 },
    { name: "Sachi I", lastMessage: "Hello, I think my luggage...", time: "Tue", unread: 0 },
    { name: "Nana K", lastMessage: "Can I get an update...", time: "Tue", unread: 0 },
    { name: "Ada P", lastMessage: "I appreciate your help...", time: "Mon", unread: 3 },
  ];

  const handleSend = () => {
    console.log("Message sent:", message);
    setMessage("");
  };

  return (
    <Box display="flex" height="100vh" bgcolor={isDark ? "background.default" : "#fff"}>
      {/* Left Sidebar */}
      <Box width="300px" bgcolor={isDark ? "#1e1e1e" : "#f5f5f5"} p={2} display="flex" flexDirection="column" gap={2}>
        {/* Search */}
        <TextField placeholder="Search" size="small" InputProps={{ startAdornment: (<InputAdornment position="start"> <SearchIcon /> </InputAdornment>), }} sx={{ bgcolor: isDark ? "#2c2c2c" : "#fff", borderRadius: 2 }} />

        {/* Conversation List */}
        <Box flexGrow={1} overflow="auto" display="flex" flexDirection="column" gap={1}>
          {conversations.map((c, index) => (
            <Paper key={index} sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1, borderRadius: 2, bgcolor: isDark ? "#2a2a2a" : "#fff", }} >
              <Avatar>{c.name.charAt(0)}</Avatar>
              <Box flexGrow={1}>
                <Typography fontSize="14px" fontWeight="bold">{c.name}</Typography>
                <Typography fontSize="12px" color="text.secondary" noWrap>{c.lastMessage}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography fontSize="10px" color="text.secondary">{c.time}</Typography>
                {c.unread > 0 && (
                  <Box bgcolor="primary.main" color="white" borderRadius="50%" width="20px" height="20px" display="flex" alignItems="center" justifyContent="center" fontSize="12px" mx="auto">
                    {c.unread}
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Chat Section */}
      <Box flexGrow={1} display="flex" flexDirection="column" borderX="1px solid" borderColor={isDark ? "#333" : "#ddd"}>
        {/* Chat Header */}
        <Box p={2} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor={isDark ? "#333" : "#ddd"}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar />
            <Box>
              <Typography fontWeight="bold">Curtis Cullen</Typography>
              <Typography fontSize="12px" color="green">Online</Typography>
            </Box>
          </Box>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Chat Messages */}
        <Box flexGrow={1} p={2} overflow="auto" display="flex" flexDirection="column" gap={2}>
          {/* User message */}
          <Box alignSelf="flex-start" bgcolor={isDark ? "#2c2c2c" : "#f5f5f5"} p={2} borderRadius={2} maxWidth="70%">
            <Typography fontSize="14px">
              Can I get an update on my luggage please? Here's my reference number: <b>ET789101</b>.
            </Typography>
          </Box>

          {/* Agent reply */}
          <Box alignSelf="flex-end" bgcolor={isDark ? "#4d664d" : "#D0E8D0"} p={2} borderRadius={2} maxWidth="70%">
            <Typography fontWeight="bold">Jamie L</Typography>
            <Typography fontSize="14px" mt={1}>
              Hi there! Thank you for providing your reference number: ET789101. <br />
              Let me check the latest status... <br /><br />
              ✅ Update: Your luggage is currently in transit and is expected to arrive at your delivery location by [insert date/time]. <br />
              If you have questions, feel free to let me know! 😉
            </Typography>
          </Box>
        </Box>

        {/* Message Input */}
        <Box p={2} borderTop="1px solid" borderColor={isDark ? "#333" : "#ddd"} display="flex" alignItems="center" gap={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            sx={{ bgcolor: isDark ? "#2c2c2c" : "#f5f5f5", borderRadius: 2 }}
          />
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Right Sidebar (User Info) */}
      <Box width="300px" bgcolor={isDark ? "#1e1e1e" : "#f9f9f9"} p={2} display="flex" flexDirection="column" gap={2}>
        <Box textAlign="center" mt={2}>
          <Avatar sx={{ width: 80, height: 80, mx: "auto" }} />
          <Typography variant="h6" fontWeight="bold" mt={1}>Curtis C</Typography>
          <Button size="small" variant="contained" sx={{ mt: 1 }}>Send Email</Button>
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Last Interacted: Few hours back
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2} mt={4}>
          <Box display="flex" alignItems="center" gap={1}>
            <EmailIcon fontSize="small" />
            <Typography variant="body2">cullenc@gmail.com</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneIcon fontSize="small" />
            <Typography variant="body2">+639653451211</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOnIcon fontSize="small" />
            <Typography variant="body2">Philippines, Manila</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LanguageIcon fontSize="small" />
            <Typography variant="body2">English, Filipino</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}