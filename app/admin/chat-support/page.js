"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, IconButton, InputAdornment, Paper, Avatar, useTheme, Autocomplete, CircularProgress, Snackbar, Alert } from "@mui/material";
import { useSearchParams } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

  const supabase = createClientComponentClient();
  
  const messagesSubscriptionRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);
  const lastMessageTimeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const currentUserRef = useRef(null);
  const selectedUserRef = useRef(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!users.length) return;
    const id = searchParams?.get('openUser');
    if (id) {
      const user = users.find(u => String(u.id) === String(id));
      if (user) setSelectedUser(user);
    }
  }, [users, searchParams]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages();
      markMessagesAsRead();
      setShouldAutoScroll(false);
    } else {
      setMessages([]);
      lastMessageTimeRef.current = null;
    }
  }, [selectedUser, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setupRealtimeSubscriptions();
      startAutoRefresh();
    }
    return () => {
      cleanupSubscriptions();
      stopAutoRefresh();
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      if (messages.length > 0) {
        lastMessageTimeRef.current = messages[messages.length - 1].created_at;
      }
    }
  }, [selectedUser, currentUser, messages]);

  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0 && selectedUser) {
      scrollToBottom();
      setShouldAutoScroll(false);
    }
  }, [messages, shouldAutoScroll, selectedUser]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return;

    if (messagesSubscriptionRef.current) {
      supabase.removeChannel(messagesSubscriptionRef.current);
    }

    messagesSubscriptionRef.current = supabase
      .channel(`messages-${currentUser.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUser.id}`
        },
        (payload) => handleNewMessage(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => handleNewMessage(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUser.id}`
        },
        (payload) => handleMessageUpdate(payload.new)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => handleMessageUpdate(payload.new)
      )
      .subscribe();
  };

  const startAutoRefresh = () => {
    if (!currentUser) return;
    
    stopAutoRefresh();
    
    autoRefreshIntervalRef.current = setInterval(() => {
      if (currentUser) {
        silentRefreshConversations();
        if (selectedUser) {
          silentRefreshMessages();
        }
      }
    }, 5000);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };

  const silentRefreshConversations = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/admin?action=conversations&userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const newConversations = data.conversations || [];
        
        setConversations(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newConversations)) {
            return newConversations;
          }
          return prev;
        });
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const silentRefreshMessages = async () => {
    if (!currentUser || !selectedUser) {
      lastMessageTimeRef.current = null;
      return;
    }

    try {
      let url = `/api/admin?action=messages&senderId=${currentUser.id}&receiverId=${selectedUser.id}`;
      if (lastMessageTimeRef.current) {
        url += `&after=${encodeURIComponent(lastMessageTimeRef.current)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        if (newMessages.length > 0) {
          const filteredNewMessages = newMessages.filter(msg => 
            (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
          );
          
          if (filteredNewMessages.length > 0) {
            lastMessageTimeRef.current = filteredNewMessages[filteredNewMessages.length - 1].created_at;
            
            setMessages(prev => {
              const existingIds = new Set(prev.map(msg => msg.id));
              const trulyNewMessages = filteredNewMessages.filter(msg => !existingIds.has(msg.id));
              
              if (trulyNewMessages.length > 0) {
                const filteredPrev = prev.filter(msg => !(msg.id && msg.id.startsWith('temp-')));
                const updatedMessages = [...filteredPrev, ...trulyNewMessages];
                setShouldAutoScroll(true);
                return updatedMessages;
              }
              return prev;
            });
            
            const messagesFromOtherUser = filteredNewMessages.filter(msg => msg.sender_id !== currentUser.id);
            if (messagesFromOtherUser.length > 0) {
              markMessagesAsRead();
            }
          }
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const cleanupSubscriptions = () => {
    if (messagesSubscriptionRef.current) {
      supabase.removeChannel(messagesSubscriptionRef.current);
      messagesSubscriptionRef.current = null;
    }
  };

  const handleNewMessage = (newMessage) => {
    const curUser = currentUserRef.current;
    const selUser = selectedUserRef.current;

    if (!curUser || !selUser) return;
    
    const isCurrentConversation = 
      ((newMessage.sender_id === curUser.id && newMessage.receiver_id === selUser.id) ||
       (newMessage.sender_id === selUser.id && newMessage.receiver_id === curUser.id));
    
    if (isCurrentConversation) {
      setMessages(prev => {
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        
        const filteredPrev = prev.filter(msg => !(msg.id && msg.id.startsWith('temp-') && msg.content === newMessage.content));
        return [...filteredPrev, newMessage];
      });
      
      lastMessageTimeRef.current = newMessage.created_at;
      setShouldAutoScroll(true);
      
      if (newMessage.sender_id !== curUser.id) {
        markMessagesAsRead();
      }
      
      silentRefreshMessages();
      
      if (newMessage.sender_id !== curUser.id) {
        showSnackbar(`New message from ${selUser.name}`, 'info');
      } else {
        showSnackbar(`Message sent to ${selUser.name}`, 'success');
      }
    } else if (newMessage.sender_id !== (currentUserRef.current?.id)) {
      const sender = users.find(user => user.id === newMessage.sender_id);
      if (sender) {
        showSnackbar(`New message from ${sender.name}`, 'info');
      }
    }

    fetchConversations();
  };

  const handleMessageUpdate = (updatedMessage) => {
    const curUser = currentUserRef.current;
    const selUser = selectedUserRef.current;
    if (!curUser || !selUser) return;
    
    const isCurrentConversation = 
      ((updatedMessage.sender_id === curUser.id && updatedMessage.receiver_id === selUser.id) ||
       (updatedMessage.sender_id === selUser.id && updatedMessage.receiver_id === curUser.id));
    
    if (isCurrentConversation) {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        )
      );
    }
  };

  const replaceTempMessage = (tempId, realMessage) => {
    setMessages(prev => prev.map(msg => msg.id === tempId ? realMessage : msg));
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markRead',
          params: {
            receiverId: currentUser.id,
            senderId: selectedUser.id
          }
        }),
      });

      if (response.ok) {
        fetchConversations();
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchConversations = async () => {
    if (!currentUser) return;

    try {
      setConversationsLoading(true);
      const response = await fetch(`/api/admin?action=conversations&userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setConversationsLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/admin?action=userSession');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          email, 
          first_name, 
          middle_initial, 
          last_name, 
          user_status_id,
          role_id,
          pfp_id,
          profiles_roles (role_name)
        `)
        .order('first_name', { ascending: true });

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.middle_initial || ''} ${user.last_name || ''}`.trim() || user.email,
        email: user.email,
        role: user.profiles_roles?.role_name || 'No Role',
        role_id: user.role_id,
        user_status_id: user.user_status_id,
        statusLabel: user.user_status_id === 1 ? 'Online' : 'Offline',
        avatarUrl: user.pfp_id || null
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      lastMessageTimeRef.current = null;
      
      const response = await fetch(`/api/admin?action=messages&senderId=${currentUser.id}&receiverId=${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];
        
        const filteredMessages = messages.filter(msg => 
          (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
          (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
        );
        
        setMessages(filteredMessages);
        
        if (filteredMessages.length > 0) {
          lastMessageTimeRef.current = filteredMessages[filteredMessages.length - 1].created_at;
        }
        
        setShouldAutoScroll(true);
      } else {
        showSnackbar('Error fetching messages', 'error');
      }
    } catch (error) {
      showSnackbar('Error fetching messages', 'error');
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedUser || !currentUser || sendingMessage) {
      return;
    }

    const messageContent = message.trim();
    setMessage("");
    messageInputRef.current?.focus();

    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      read_at: null,
      sender: {
        id: currentUser.id,
        first_name: currentUser.name.split(' ')[0] || '',
        middle_initial: currentUser.name.split(' ')[1] || '',
        last_name: currentUser.name.split(' ').slice(2).join(' ') || '',
        email: currentUser.email
      },
      receiver: {
        id: selectedUser.id,
        first_name: selectedUser.name.split(' ')[0] || '',
        middle_initial: selectedUser.name.split(' ')[1] || '',
        last_name: selectedUser.name.split(' ').slice(2).join(' ') || '',
        email: selectedUser.email
      }
    };

    setMessages(prev => [...prev, tempMessage]);
    setShouldAutoScroll(true);

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          params: {
            senderId: currentUser.id,
            receiverId: selectedUser.id,
            content: messageContent
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        replaceTempMessage(tempMessage.id, data.message);
        showSnackbar('Message sent successfully', 'success');
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || 'Failed to send message', 'error');
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setMessage(messageContent);
      }
    } catch (error) {
      showSnackbar('Error sending message', 'error');
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setMessage(messageContent);
    } finally {
      setSendingMessage(false);
      messageInputRef.current?.focus();
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSearchChange = (event, value) => {
    setSearchQuery(value);
    setFilteredUsers(value ? users.filter(user => 
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    ) : users);
  };

  const handleUserSelect = (event, selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchQuery(selectedUser?.name || "");
  };

  const handleConversationSelect = (conversation) => {
    const user = users.find(u => u.id === conversation.id);
    if (!user) return;
    
    if (selectedUser?.id === user.id) {
      fetchMessages();
      return;
    }
    
    setMessages([]);
    lastMessageTimeRef.current = null;
    setSelectedUser(user);
  };

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

  const formatMessageTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatConversationTime = (timestamp) => {
    const date = new Date(timestamp);
    const diffInHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSenderLabel = (conversation) => {
    return conversation.isOwnMessage ? 'You' : conversation.name.split(' ')[0] || conversation.name;
  };

  const isOwnMessage = (message) => message.sender_id === currentUser?.id;
  const isMessageRead = (message) => message.read_at !== null;
  const isTempMessage = (message) => message.id && message.id.startsWith('temp-');

  const getAvatarForUserId = (userId) => users.find(u => u.id === userId)?.avatarUrl || null;

  const getMessageAvatarUrl = (msg) => {
    const curUser = currentUserRef.current;
    const selUser = selectedUserRef.current;

    if (msg.sender && msg.sender.pfp_id) return msg.sender.pfp_id;

    if (curUser && msg.sender_id === curUser.id) {
      return getAvatarForUserId(curUser.id) || null;
    }
    if (selUser && msg.sender_id === selUser.id) {
      return selUser.avatarUrl || getAvatarForUserId(selUser.id) || null;
    }

    return getAvatarForUserId(msg.sender_id) || null;
  };

  const containerStyles = { position: "absolute", top: 0, left: "72px", right: 0, bottom: 0, display: "flex", bgcolor: theme.palette.background.default };
  const sidebarStyles = { width: "350px", flex: "0 0 350px", flexShrink: 0, borderRight: "1px solid", borderColor: "divider", bgcolor: theme.palette.background.paper, display: "flex", flexDirection: "column", p: 2, gap: 2 };
  const searchFieldStyles = { bgcolor: theme.palette.background.default, borderRadius: 2 };
  const conversationsStyles = { flexGrow: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 1 };
  const conversationItemStyles = { p: 1.5, display: "flex", alignItems: "center", gap: 1, borderRadius: 2, bgcolor: theme.palette.background.default, cursor: "pointer", "&:hover": { bgcolor: theme.palette.action.hover } };
  const nameStyles = { fontSize: "14px", fontWeight: "bold" };
  const messageStyles = { fontSize: "12px", color: "text.secondary", noWrap: true };
  const timeStyles = { fontSize: "10px", color: "text.secondary" };
  const unreadBadgeStyles = { bgcolor: "primary.main", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", mx: "auto" };
  const chatContainerStyles = { flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", bgcolor: theme.palette.background.default };
  const headerStyles = { p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" };
  const userInfoStyles = { display: "flex", alignItems: "center", gap: 2 };
  const statusStyles = { fontSize: "12px" };
  const messagesContainerStyles = { flexGrow: 1, p: 2, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 };
  const messageBubbleStyles = { p: 2, borderRadius: 2, maxWidth: "50%", display: "inline-block", position: "relative", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" };
  const receivedMessageStyles = { 
    ...messageBubbleStyles, 
    display: "inline-block",
    alignSelf: "flex-start",
    bgcolor: isDark ? theme.palette.grey[800] : theme.palette.grey[100],
    color: isDark ? theme.palette.common.white : theme.palette.text.primary,
    border: `1px solid ${isDark ? theme.palette.grey[700] : theme.palette.grey[300]}`,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    '&::after': {
      content: '""',
      position: 'absolute',
      left: -8,
      bottom: 0,
      width: 0,
      height: 0,
      borderTop: '8px solid transparent',
      borderRight: `8px solid ${isDark ? theme.palette.grey[800] : theme.palette.grey[100]}`,
      borderBottom: '8px solid transparent'
    }
  };
  const sentMessageStyles = { 
    ...messageBubbleStyles, 
    display: "inline-block",
    alignSelf: "flex-end", 
    bgcolor: isDark ? "#4d664d" : "#D0E8D0",
    color: isDark ? theme.palette.common.white : theme.palette.text.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    '&::after': {
      content: '""',
      position: 'absolute',
      right: -8,
      bottom: 0,
      width: 0,
      height: 0,
      borderTop: '8px solid transparent',
      borderLeft: `8px solid ${isDark ? '#4d664d' : '#D0E8D0'}`,
      borderBottom: '8px solid transparent'
    }
  };
  const tempMessageStyles = { ...sentMessageStyles, opacity: 0.7 };
  const messageTextStyles = { fontSize: "14px" };
  const messageTimeStyles = { fontSize: "10px", color: "text.secondary", mt: 0.5 };
  const messageStatusStyles = { fontSize: "10px", color: "text.secondary", mt: 0.5, fontStyle: "italic" };
  const inputContainerStyles = { p: 2, display: "flex", alignItems: "center", borderTop: "1px solid", borderColor: "divider", gap: 2 };
  const inputFieldStyles = { bgcolor: theme.palette.background.paper, borderRadius: 2 };

  return (
    <Box sx={containerStyles}>
      <Box sx={sidebarStyles}>
        <Autocomplete
          freeSolo
          options={filteredUsers}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option.name || '';
          }}
          inputValue={searchQuery}
          onInputChange={handleSearchChange}
          onChange={handleUserSelect}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search users..."
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={searchFieldStyles}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Avatar sx={{ width: 32, height: 32, fontSize: "12px" }} src={option.avatarUrl || undefined}>
                  {(!option.avatarUrl && option.name) ? option.name.charAt(0) : ''}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
                    {option.name}
                  </Typography>
                  <Typography sx={{ fontSize: "12px", color: "text.secondary" }}>
                    {option.email} • {option.role}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        />
        
        <Box sx={conversationsStyles}>
          {conversationsLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "text.secondary" }}>
              <CircularProgress size={24} />
            </Box>
          ) : conversations.length === 0 ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "text.secondary" }}>
              <Typography>No conversations yet</Typography>
            </Box>
          ) : (
            conversations.map((conversation) => (
              <Paper 
                key={conversation.id} 
                sx={conversationItemStyles}
                onClick={() => handleConversationSelect(conversation)}
              >
                <Avatar src={conversation.avatarUrl || undefined}>
                  {(!conversation.avatarUrl && conversation.name) ? conversation.name.charAt(0) : ''}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography sx={nameStyles}>{conversation.name}</Typography>
                  <Typography sx={messageStyles}>
                    {getSenderLabel(conversation)}: {conversation.lastMessage}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography sx={timeStyles}>
                    {formatConversationTime(conversation.lastMessageTime)}
                  </Typography>
                  {conversation.unreadCount > 0 && (
                    <Box sx={unreadBadgeStyles}>{conversation.unreadCount}</Box>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </Box>

      <Box sx={chatContainerStyles}>
        <Box sx={headerStyles}>
          <Box sx={userInfoStyles}>
            <Avatar src={selectedUser?.avatarUrl || undefined}>
              {selectedUser ? (!selectedUser.avatarUrl && selectedUser.name.charAt(0)) : ""}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: "bold" }}>
                {selectedUser ? selectedUser.name : "Select a conversation"}
              </Typography>
              <Typography 
                sx={{ 
                  ...statusStyles,
                  color: selectedUser 
                    ? (selectedUser.user_status_id === 1 ? 'success.main' : 'text.secondary') 
                    : 'text.secondary' 
                }}
              >
                {selectedUser ? (selectedUser.user_status_id === 1 ? 'Online' : 'Offline') : 'No active chat'}
              </Typography>
            </Box>
          </Box>
          <IconButton disabled={!selectedUser}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={messagesContainerStyles}>
          {selectedUser ? (
            messages.length > 0 ? (
              <>
                {messages.map((msg, index) => (
                  <Box 
                    key={msg.id || index} 
                    sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexDirection: isOwnMessage(msg) ? 'row-reverse' : 'row' }}
                  >
                    <Avatar sx={{ width: 28, height: 28 }} src={getMessageAvatarUrl(msg) || undefined}>
                      {!getMessageAvatarUrl(msg) && (isOwnMessage(msg) ? (currentUser?.name?.charAt(0) || '') : (selectedUser?.name?.charAt(0) || ''))}
                    </Avatar>
                    <Box sx={isOwnMessage(msg) ? (isTempMessage(msg) ? tempMessageStyles : sentMessageStyles) : receivedMessageStyles}>
                      <Typography sx={messageTextStyles}>
                        {msg.content}
                      </Typography>
                      <Typography sx={messageTimeStyles}>
                        {formatMessageTime(msg.created_at)}
                      </Typography>
                      {isOwnMessage(msg) && !isTempMessage(msg) && (
                        <Typography sx={messageStatusStyles}>
                          {isMessageRead(msg) ? '✓ Read' : '✓ Sent'}
                        </Typography>
                      )}
                      {isTempMessage(msg) && (
                        <Typography sx={messageStatusStyles}>
                          Sending...
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "text.secondary" }}>
                <Typography>No messages yet. Start the conversation!</Typography>
              </Box>
            )
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "text.secondary" }}>
              <Typography>Select a conversation to start chatting</Typography>
            </Box>
          )}
        </Box>

        <Box sx={inputContainerStyles}>
          <TextField 
            fullWidth 
            size="small" 
            placeholder={selectedUser ? `Type a message to ${selectedUser.name}` : "Type a message"} 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            sx={inputFieldStyles} 
            disabled={!selectedUser}
            inputRef={messageInputRef}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend} 
            disabled={!selectedUser || !message.trim() || sendingMessage}
          >
            {sendingMessage ? <CircularProgress size={20} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}