"use client";

import { useState } from "react";
import { Box, Typography, TextField, IconButton, InputAdornment, Paper, Avatar, Button, useTheme } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function Page() {
  // Theme and state setup
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [message, setMessage] = useState("");

  // Mock conversations data
  const conversations = [
    { name: "Naiza Albina", lastMessage: "Hi, I'd like to check...", time: "4:30pm", unread: 3 },
    { name: "Curtis C", lastMessage: "How are you today?", time: "5:30pm", unread: 0 },
    { name: "Allen C", lastMessage: "Good day! I'm still...", time: "Thu", unread: 2 },
    { name: "Francis S", lastMessage: "Hi there! I haven't...", time: "Wed", unread: 0 },
    { name: "John M", lastMessage: "Can you help me...", time: "Tue", unread: 6 },
    { name: "Sachi I", lastMessage: "Hello, I think my luggage...", time: "Tue", unread: 0 },
    { name: "Nana K", lastMessage: "Can I get an update...", time: "Tue", unread: 0 },
    { name: "Ada P", lastMessage: "I appreciate your help...", time: "Mon", unread: 3 },
  ];

  // Event handlers
  const handleSend = () => { setMessage(""); };

  // Styles
  const containerStyles = { position: "absolute", top: 0, left: "280px", right: 0, bottom: 0, display: "flex", bgcolor: theme.palette.background.default };
  const sidebarStyles = { width: "350px", borderRight: "1px solid", borderColor: "divider", bgcolor: theme.palette.background.paper, display: "flex", flexDirection: "column", p: 2, gap: 2 };
  const searchFieldStyles = { bgcolor: theme.palette.background.default, borderRadius: 2 };
  const conversationsStyles = { flexGrow: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 1 };
  const conversationItemStyles = { p: 1.5, display: "flex", alignItems: "center", gap: 1, borderRadius: 2, bgcolor: theme.palette.background.default };
  const nameStyles = { fontSize: "14px", fontWeight: "bold" };
  const messageStyles = { fontSize: "12px", color: "text.secondary", noWrap: true };
  const timeStyles = { fontSize: "10px", color: "text.secondary" };
  const unreadBadgeStyles = { bgcolor: "primary.main", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", mx: "auto" };
  const chatContainerStyles = { flexGrow: 1, display: "flex", flexDirection: "column", bgcolor: theme.palette.background.default };
  const headerStyles = { p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" };
  const userInfoStyles = { display: "flex", alignItems: "center", gap: 2 };
  const statusStyles = { fontSize: "12px", color: "green" };
  const messagesContainerStyles = { flexGrow: 1, p: 2, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 };
  const messageBubbleStyles = { p: 2, borderRadius: 2, maxWidth: "70%" };
  const receivedMessageStyles = { ...messageBubbleStyles, bgcolor: theme.palette.background.paper };
  const sentMessageStyles = { ...messageBubbleStyles, alignSelf: "flex-end", bgcolor: isDark ? "#4d664d" : "#D0E8D0" };
  const messageTextStyles = { fontSize: "14px" };
  const inputContainerStyles = { p: 2, display: "flex", alignItems: "center", borderTop: "1px solid", borderColor: "divider", gap: 2 };
  const inputFieldStyles = { bgcolor: theme.palette.background.paper, borderRadius: 2 };

  return (
    <Box sx={containerStyles}>
      <Box sx={sidebarStyles}>
        <TextField placeholder="Search" size="small" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={searchFieldStyles} />
        <Box sx={conversationsStyles}>
          {conversations.map((c, index) => (
            <Paper key={index} sx={conversationItemStyles}>
              <Avatar>{c.name.charAt(0)}</Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={nameStyles}>{c.name}</Typography>
                <Typography sx={messageStyles}>{c.lastMessage}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={timeStyles}>{c.time}</Typography>
                {c.unread > 0 && <Box sx={unreadBadgeStyles}>{c.unread}</Box>}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      <Box sx={chatContainerStyles}>
        <Box sx={headerStyles}>
          <Box sx={userInfoStyles}>
            <Avatar />
            <Box>
              <Typography sx={{ fontWeight: "bold" }}>Curtis Cullen</Typography>
              <Typography sx={statusStyles}>Online</Typography>
            </Box>
          </Box>
          <IconButton><MoreVertIcon /></IconButton>
        </Box>

        <Box sx={messagesContainerStyles}>
          <Box sx={receivedMessageStyles}>
            <Typography sx={messageTextStyles}>Can I get an update on my luggage please? Here's my reference number: <b>ET789101</b>.</Typography>
          </Box>

          <Box sx={sentMessageStyles}>
            <Typography sx={{ fontWeight: "bold" }}>Jamie L</Typography>
            <Typography sx={{ ...messageTextStyles, mt: 1 }}>
              Hi there! Thank you for providing your reference number: ET789101. <br />
              Let me check the latest status... <br /><br />
              ✅ Update: Your luggage is currently in transit and is expected to arrive at your delivery location by [insert date/time]. <br />
              If you have questions, feel free to let me know! 😉
            </Typography>
          </Box>
        </Box>

        <Box sx={inputContainerStyles}>
          <TextField fullWidth size="small" placeholder="Type a message" value={message} onChange={(e) => setMessage(e.target.value)} sx={inputFieldStyles} />
          <IconButton color="primary" onClick={handleSend}><SendIcon /></IconButton>
        </Box>
      </Box>
    </Box>
  );
}