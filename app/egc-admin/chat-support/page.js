"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, IconButton, InputAdornment, Paper, Avatar, Button, useTheme, Autocomplete, CircularProgress, Snackbar, Alert } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Page() {
  // Theme and state setup
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

  // Supabase client
  const supabase = createClientComponentClient();
  
  // Refs for real-time subscriptions and auto-refresh
  const messagesSubscriptionRef = useRef(null);
  const conversationsSubscriptionRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);
  const lastMessageTimeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentUserRef = useRef(null);
  const selectedUserRef = useRef(null);

  // Keep refs in sync with state to avoid stale closures in realtime callbacks
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch current user and users on component mount
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  // Fetch conversations when current user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchMessages();
      // Mark messages as read when conversation is opened
      markMessagesAsRead();
      // Don't auto-scroll when switching conversations
      setShouldAutoScroll(false);
    } else {
      setMessages([]);
      // Reset last message time when no conversation is selected
      lastMessageTimeRef.current = null;
    }
  }, [selectedUser, currentUser]);

  // Set up real-time subscriptions when current user is loaded
  useEffect(() => {
    if (currentUser) {
      setupRealtimeSubscriptions();
      startAutoRefresh();
    }

    // Cleanup subscriptions and auto-refresh on unmount
    return () => {
      cleanupSubscriptions();
      stopAutoRefresh();
    };
  }, [currentUser]);

  // Start auto-refresh when a conversation is selected
  useEffect(() => {
    if (selectedUser && currentUser) {
      console.log('Conversation selected:', selectedUser.name);
      // Update last message time for incremental refresh
      if (messages.length > 0) {
        lastMessageTimeRef.current = messages[messages.length - 1].created_at;
        console.log('Updated last message time for auto-refresh:', lastMessageTimeRef.current);
      } else {
        console.log('No messages yet, will fetch all messages on next auto-refresh');
      }
    }
  }, [selectedUser, currentUser, messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Only auto-scroll if we should and there are messages
    if (shouldAutoScroll && messages.length > 0 && selectedUser) {
      scrollToBottom();
      setShouldAutoScroll(false); // Reset the flag
    }
  }, [messages, shouldAutoScroll, selectedUser]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!currentUser) return;

    console.log('Setting up real-time subscriptions for user:', currentUser.id);

    // Clean up any existing subscription first
    if (messagesSubscriptionRef.current) {
      supabase.removeChannel(messagesSubscriptionRef.current);
    }

    // Subscribe to messages where current user is either sender or receiver (use two filters instead of OR)
    messagesSubscriptionRef.current = supabase
      .channel(`messages-${currentUser.id}-${Date.now()}`)
      // INSERTs where current user is the sender
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Real-time INSERT (as sender) received:', payload);
          handleNewMessage(payload.new);
        }
      )
      // INSERTs where current user is the receiver
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Real-time INSERT (as receiver) received:', payload);
          handleNewMessage(payload.new);
        }
      )
      // UPDATEs where current user is the sender
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Real-time UPDATE (as sender) received:', payload);
          handleMessageUpdate(payload.new);
        }
      )
      // UPDATEs where current user is the receiver
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Real-time UPDATE (as receiver) received:', payload);
          handleMessageUpdate(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error');
        }
      });

    console.log('Real-time subscriptions set up for user:', currentUser.id);
  };

  // Start auto-refresh mechanism
  const startAutoRefresh = () => {
    if (!currentUser) return;

    console.log('Starting auto-refresh mechanism');
    
    // Stop any existing auto-refresh
    stopAutoRefresh();
    
    // Refresh conversations every 5 seconds
    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refresh interval triggered');
      if (currentUser) {
        console.log('Auto-refresh: Refreshing conversations and messages');
        // Silently refresh conversations
        silentRefreshConversations();
        
        // Silently refresh messages if a conversation is active
        if (selectedUser) {
          console.log('Auto-refresh: Refreshing messages for conversation:', selectedUser.name);
          silentRefreshMessages();
        } else {
          console.log('Auto-refresh: No conversation selected, skipping message refresh');
        }
      } else {
        console.log('Auto-refresh: No current user, skipping refresh');
      }
    }, 5000); // 5 seconds
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (autoRefreshIntervalRef.current) {
      console.log('Stopping auto-refresh mechanism');
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };

  // Silent refresh conversations (no loading state, no notifications)
  const silentRefreshConversations = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/conversations?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const newConversations = data.conversations || [];
        
        // Only update if there are actual changes
        setConversations(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newConversations)) {
            console.log('Auto-refresh: Conversations updated');
            return newConversations;
          }
          return prev;
        });
      }
    } catch (error) {
      console.log('Auto-refresh: Error refreshing conversations:', error);
    }
  };

  // Silent refresh messages (no loading state, no notifications)
  const silentRefreshMessages = async () => {
    if (!currentUser || !selectedUser) {
      // Reset last message time when no conversation is selected
      lastMessageTimeRef.current = null;
      return;
    }

    try {
      console.log('Auto-refresh: Checking for new messages...');
      
      // Use incremental refresh if we have a last message time
      let url = `/api/messages?senderId=${currentUser.id}&receiverId=${selectedUser.id}`;
      if (lastMessageTimeRef.current) {
        url += `&after=${encodeURIComponent(lastMessageTimeRef.current)}`;
        console.log('Auto-refresh: Using incremental fetch after:', lastMessageTimeRef.current);
      } else {
        console.log('Auto-refresh: Fetching all messages (no last message time)');
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        console.log('Auto-refresh: Response received, messages count:', newMessages.length);
        
        if (newMessages.length > 0) {
          console.log('Auto-refresh: Found new messages:', newMessages.length);
          console.log('New messages:', newMessages);
          
          // Filter messages to ensure they belong to current conversation (bidirectional)
          const filteredNewMessages = newMessages.filter(msg => 
            (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
          );
          
          console.log('Auto-refresh: Filtered new messages count:', filteredNewMessages.length);
          
          if (filteredNewMessages.length > 0) {
            // Update last message time
            lastMessageTimeRef.current = filteredNewMessages[filteredNewMessages.length - 1].created_at;
            console.log('Auto-refresh: Updated last message time to:', lastMessageTimeRef.current);
            
            // Add only new messages
            setMessages(prev => {
              console.log('Auto-refresh: Current messages count:', prev.length);
              const existingIds = new Set(prev.map(msg => msg.id));
              const trulyNewMessages = filteredNewMessages.filter(msg => !existingIds.has(msg.id));
              
              console.log('Auto-refresh: Truly new messages:', trulyNewMessages.length);
              
              if (trulyNewMessages.length > 0) {
                console.log('Auto-refresh: Adding new messages to chat:', trulyNewMessages.length);
                
                // Remove any temporary messages that might conflict
                const filteredPrev = prev.filter(msg => !(msg.id && msg.id.startsWith('temp-')));
                console.log('Auto-refresh: Filtered previous messages count:', filteredPrev.length);
                
                const updatedMessages = [...filteredPrev, ...trulyNewMessages];
                console.log('Auto-refresh: Final messages count:', updatedMessages.length);
                
                // Enable auto-scroll for new messages from auto-refresh
                setShouldAutoScroll(true);
                
                return updatedMessages;
              }
              return prev;
            });
            
            // Mark messages as read if they're from the other user
            const messagesFromOtherUser = filteredNewMessages.filter(msg => msg.sender_id !== currentUser.id);
            if (messagesFromOtherUser.length > 0) {
              console.log('Auto-refresh: Marking messages as read');
              markMessagesAsRead();
            }
          } else {
            console.log('Auto-refresh: No filtered new messages found');
          }
        } else {
          console.log('Auto-refresh: No new messages found');
        }
      } else {
        console.log('Auto-refresh: Failed to fetch messages, status:', response.status);
      }
    } catch (error) {
      console.log('Auto-refresh: Error refreshing messages:', error);
    }
  };

  // Cleanup subscriptions
  const cleanupSubscriptions = () => {
    if (messagesSubscriptionRef.current) {
      console.log('Cleaning up message subscription');
      supabase.removeChannel(messagesSubscriptionRef.current);
      messagesSubscriptionRef.current = null;
    }
    if (conversationsSubscriptionRef.current) {
      supabase.removeChannel(conversationsSubscriptionRef.current);
      conversationsSubscriptionRef.current = null;
    }
  };

  // Handle new message received
  const handleNewMessage = (newMessage) => {
    console.log('New message received:', newMessage);
    
    const curUser = currentUserRef.current;
    const selUser = selectedUserRef.current;

    if (!curUser || !selUser) return;
    
    // Check if this message belongs to the current conversation
    const isCurrentConversation = 
      ((newMessage.sender_id === curUser.id && newMessage.receiver_id === selUser.id) ||
       (newMessage.sender_id === selUser.id && newMessage.receiver_id === curUser.id));
    
    if (isCurrentConversation) {
      // Add message to current conversation immediately
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) {
          console.log('Message already exists, skipping duplicate');
          return prev;
        }
        
        // Remove any temporary message with the same content (for sent messages)
        const filteredPrev = prev.filter(msg => !(msg.id && msg.id.startsWith('temp-') && msg.content === newMessage.content));
        
        console.log('Adding new message to conversation');
        return [...filteredPrev, newMessage];
      });
      
      // Update last message time for auto-refresh
      lastMessageTimeRef.current = newMessage.created_at;
      
      // Enable auto-scroll for new messages
      setShouldAutoScroll(true);
      
      // Mark message as read if it's from the other user
      if (newMessage.sender_id !== curUser.id) {
        markMessagesAsRead();
      }
      
      // Ensure UI syncs by fetching latest messages silently
      silentRefreshMessages();
      
      // Show notification if message is from other user
      if (newMessage.sender_id !== curUser.id) {
        showSnackbar(`New message from ${selUser.name}`, 'info');
      } else {
        showSnackbar(`Message sent to ${selUser.name}`, 'success');
      }
    } else if (newMessage.sender_id !== (currentUserRef.current?.id)) {
      // Show notification for messages from other users in different conversations
      const sender = users.find(user => user.id === newMessage.sender_id);
      if (sender) {
        showSnackbar(`New message from ${sender.name}`, 'info');
      }
    }

    // Refresh conversations list to update last message
    fetchConversations();
  };

  // Handle message updates (e.g., read status)
  const handleMessageUpdate = (updatedMessage) => {
    console.log('Message update received:', updatedMessage);

    const curUser = currentUserRef.current;
    const selUser = selectedUserRef.current;
    if (!curUser || !selUser) return;
    
    // Only update if this message belongs to the current conversation
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

  // Replace temporary message with real message (fallback)
  const replaceTempMessage = (tempId, realMessage) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === tempId ? realMessage : msg
      )
    );
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!selectedUser || !currentUser) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: currentUser.id,
          senderId: selectedUser.id
        }),
      });

      if (!response.ok) {
        console.error('Failed to mark messages as read');
      } else {
        // Refresh conversations to update unread counts
        fetchConversations();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    if (!currentUser) return;

    try {
      setConversationsLoading(true);
      const response = await fetch(`/api/conversations?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setConversationsLoading(false);
    }
  };

  // Fetch current user session
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/user-session');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      } else {
        console.error('Failed to fetch current user');
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  // Fetch users from profiles table
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
        avatarUrl: user.pfp_id || null
      }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages between current user and selected user
  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for conversation:', selectedUser.name);
      console.log('Current user ID:', currentUser.id);
      console.log('Selected user ID:', selectedUser.id);
      
      // Reset last message time when switching conversations
      lastMessageTimeRef.current = null;
      
      const response = await fetch(`/api/messages?senderId=${currentUser.id}&receiverId=${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const messages = data.messages || [];
        console.log('Fetched messages:', messages.length);
        
        // Verify message filtering (bidirectional) - this should be redundant since API already filters
        const filteredMessages = messages.filter(msg => 
          (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
          (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
        );
        
        console.log('Filtered messages count:', filteredMessages.length);
        console.log('Message details:', filteredMessages.map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          content: msg.content.substring(0, 50) + '...'
        })));
        
        setMessages(filteredMessages);
        
        // Update last message time for auto-refresh
        if (filteredMessages.length > 0) {
          lastMessageTimeRef.current = filteredMessages[filteredMessages.length - 1].created_at;
          console.log('Last message time updated:', lastMessageTimeRef.current);
        }
        
        // Auto-scroll to bottom when messages are loaded
        setShouldAutoScroll(true);
      } else {
        console.error('Failed to fetch messages');
        showSnackbar('Error fetching messages', 'error');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      showSnackbar('Error fetching messages', 'error');
    }
  };

  // Send message
  const handleSend = async () => {
    if (!message.trim() || !selectedUser || !currentUser || sendingMessage) {
      return;
    }

    const messageContent = message.trim();
    setMessage(""); // Clear input immediately for better UX

    // Create a temporary message object for immediate display
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

    // Add temporary message immediately for instant feedback
    setMessages(prev => [...prev, tempMessage]);
    setShouldAutoScroll(true); // Enable auto-scroll for sent message

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          content: messageContent
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Message sent successfully:', data.message);
        
        // Replace temporary message with real message immediately
        replaceTempMessage(tempMessage.id, data.message);
        
        showSnackbar('Message sent successfully', 'success');
      } else {
        const errorData = await response.json();
        showSnackbar(errorData.error || 'Failed to send message', 'error');
        // Remove temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        // Restore message if sending failed
        setMessage(messageContent);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showSnackbar('Error sending message', 'error');
      // Remove temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      // Restore message if sending failed
      setMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // Filter users based on search query
  const handleSearchChange = (event, value) => {
    setSearchQuery(value);
    
    if (!value) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(value.toLowerCase()) ||
      user.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  // Handle user selection
  const handleUserSelect = (event, selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchQuery(selectedUser ? selectedUser.name : "");
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    const user = users.find(u => u.id === conversation.id);
    if (user) {
      // If the same conversation is selected, just refresh messages and do nothing else
      if (selectedUser && selectedUser.id === user.id) {
        console.log('Same conversation selected, refreshing messages');
        fetchMessages();
        return;
      }

      console.log('Selecting conversation with:', user.name);
      
      // Clear current messages only when switching to a different conversation
      setMessages([]);
      lastMessageTimeRef.current = null;
      
      setSelectedUser(user);
    }
  };

  // Show snackbar
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format conversation time
  const formatConversationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get sender label for conversation
  const getSenderLabel = (conversation) => {
    if (conversation.isOwnMessage) {
      return 'You';
    } else {
      return conversation.name.split(' ')[0] || conversation.name;
    }
  };

  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.sender_id === currentUser?.id;
  };

  // Check if message is read
  const isMessageRead = (message) => {
    return message.read_at !== null;
  };

  // Check if message is temporary (not yet saved to database)
  const isTempMessage = (message) => {
    return message.id && message.id.startsWith('temp-');
  };

  // Styles
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
  const statusStyles = { fontSize: "12px", color: "green" };
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
              <Typography sx={statusStyles}>
                {selectedUser ? "Online" : "No active chat"}
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
                    sx={isOwnMessage(msg) ? (isTempMessage(msg) ? tempMessageStyles : sentMessageStyles) : receivedMessageStyles}
                  >
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
            disabled={!selectedUser || sendingMessage}
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