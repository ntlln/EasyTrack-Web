"use client";

import { useState } from "react";
import { Box, Typography, TextField, IconButton, InputAdornment, Paper, Avatar, Button, useTheme } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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
    <Box position="absolute" top={0} left="280px" right={0} bottom={0} display="flex" bgcolor={theme.palette.background.default}>
      {/* Sidebar: Conversations */}
      <Box width="350px" borderRight="1px solid" borderColor="divider" bgcolor={theme.palette.background.paper} display="flex" flexDirection="column" p={2} gap={2}>
        <TextField placeholder="Search" size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ bgcolor: theme.palette.background.default, borderRadius: 2 }} />

        <Box flexGrow={1} overflow="auto" display="flex" flexDirection="column" gap={1}>
          {conversations.map((c, index) => (
            <Paper key={index} sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1, borderRadius: 2, bgcolor: theme.palette.background.default }}>
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

      {/* Chat Area */}
      <Box flexGrow={1} display="flex" flexDirection="column" bgcolor={theme.palette.background.default}>
        {/* Header */}
        <Box p={2} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor="divider">
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

        {/* Messages */}
        <Box flexGrow={1} p={2} overflow="auto" display="flex" flexDirection="column" gap={2}>
          <Box alignSelf="flex-start" bgcolor={theme.palette.background.paper} p={2} borderRadius={2} maxWidth="70%">
            <Typography fontSize="14px">
              Can I get an update on my luggage please? Here's my reference number: <b>ET789101</b>.
            </Typography>
          </Box>

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

        {/* Input */}
        <Box
          p={2}
          display="flex"
          alignItems="center"
          borderTop="1px solid"
          borderColor="divider"
          gap={2}
        >
          <TextField fullWidth size="small" placeholder="Type a message" value={message} onChange={(e) => setMessage(e.target.value)} sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2 }} />
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}