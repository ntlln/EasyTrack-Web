"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, TextField, IconButton, InputAdornment, Paper, Avatar, useTheme, Autocomplete, CircularProgress, Snackbar, Alert } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';

export default function Page() {
    // Theme and state setup
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const [message, setMessage] = useState("");
    const supabase = createClientComponentClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const currentUserRef = useRef(null);
    const selectedUserRef = useRef(null);
    const realtimeChannelRef = useRef(null);
    const searchParams = useSearchParams();
    const autoRefreshIntervalRef = useRef(null);
    const lastMessageTimeRef = useRef(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

    // Initial data load
    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
    }, []);

    // Load conversations and realtime when user ready
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
            setupRealtime();
            startAutoRefresh();
        }
        return () => {
            if (realtimeChannelRef.current) {
                supabase.removeChannel(realtimeChannelRef.current);
                realtimeChannelRef.current = null;
            }
            stopAutoRefresh();
        };
    }, [currentUser]);

    // Open conversation from URL param if provided
    useEffect(() => {
        if (!users.length) return;
        const id = searchParams?.get('openUser');
        if (id) {
            const user = users.find(u => String(u.id) === String(id));
            if (user) setSelectedUser(user);
        }
    }, [users, searchParams]);

    // Load messages on conversation change
    useEffect(() => {
        if (currentUser && selectedUser) {
            fetchMessages();
            markMessagesAsRead();
        } else {
            setMessages([]);
        }
    }, [selectedUser, currentUser]);

    // Track selected conversation changes for incremental refresh and scrolling
    useEffect(() => {
        if (selectedUser && currentUser) {
            // update last message time when switching conversations
            if (messages.length > 0) {
                lastMessageTimeRef.current = messages[messages.length - 1].created_at;
            } else {
                lastMessageTimeRef.current = null;
            }
            setShouldAutoScroll(false);
        } else {
            lastMessageTimeRef.current = null;
        }
    }, [selectedUser, currentUser, messages]);

    // Auto-scroll when flagged
    useEffect(() => {
        if (shouldAutoScroll && messages.length > 0 && selectedUser) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setShouldAutoScroll(false);
        }
    }, [messages, shouldAutoScroll, selectedUser]);

    // Data functions
    const fetchCurrentUser = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: profile } = await supabase
                .from('profiles')
                .select(`id, email, first_name, middle_initial, last_name, role_id, profiles_roles (role_name), pfp_id`)
                .eq('id', session.user.id)
                .single();
            if (profile) {
                setCurrentUser({
                    id: profile.id,
                    email: profile.email,
                    name: `${profile.first_name || ''} ${profile.middle_initial || ''} ${profile.last_name || ''}`.trim() || profile.email,
                    role: profile.profiles_roles?.role_name || 'No Role',
                    role_id: profile.role_id,
                    avatarUrl: profile.pfp_id || null
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const { data, error } = await supabase
                .from('profiles')
                .select(`id, email, first_name, middle_initial, last_name, role_id, user_status_id, profiles_roles (role_name), pfp_id`)
                .order('first_name', { ascending: true });
            if (error) throw error;
            const formatted = (data || []).map(u => ({
                id: u.id,
                name: `${u.first_name || ''} ${u.middle_initial || ''} ${u.last_name || ''}`.trim() || u.email,
                email: u.email,
                role: u.profiles_roles?.role_name || 'No Role',
                role_id: u.role_id,
                user_status_id: u.user_status_id,
                avatarUrl: u.pfp_id || null
            }));
            setUsers(formatted);
            setFilteredUsers(formatted);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchConversations = async () => {
        if (!currentUser) return;
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`id, sender_id, receiver_id, content, created_at, read_at,
                         sender:profiles!messages_sender_id_fkey (id, first_name, middle_initial, last_name, email, pfp_id),
                         receiver:profiles!messages_receiver_id_fkey (id, first_name, middle_initial, last_name, email, pfp_id)`)
                .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                .order('created_at', { ascending: false });
            if (error) throw error;

            const map = new Map();
            (data || []).forEach(m => {
                const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
                const otherUser = m.sender_id === currentUser.id ? m.receiver : m.sender;
                if (!map.has(otherId)) {
                    map.set(otherId, { otherUserId: otherId, otherUser, lastMessage: m, unreadCount: (!m.read_at && m.receiver_id === currentUser.id) ? 1 : 0 });
                } else {
                    const conv = map.get(otherId);
                    if (new Date(m.created_at) > new Date(conv.lastMessage.created_at)) conv.lastMessage = m;
                    if (!m.read_at && m.receiver_id === currentUser.id) conv.unreadCount += 1;
                }
            });

            const formatted = Array.from(map.values()).map(conv => ({
                id: conv.otherUserId,
                name: `${conv.otherUser.first_name || ''} ${conv.otherUser.middle_initial || ''} ${conv.otherUser.last_name || ''}`.trim() || conv.otherUser.email,
                email: conv.otherUser.email,
                avatarUrl: conv.otherUser.pfp_id || null,
                lastMessage: conv.lastMessage.content,
                lastMessageTime: conv.lastMessage.created_at,
                unreadCount: conv.unreadCount,
                isOwnMessage: conv.lastMessage.sender_id === currentUser.id
            })).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

            setConversations(formatted);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchMessages = async () => {
        if (!currentUser || !selectedUser) return;
        try {
            lastMessageTimeRef.current = null;
            const res = await fetch(`/api/admin?action=messages&senderId=${currentUser.id}&receiverId=${selectedUser.id}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const json = await res.json();
            const list = (json.messages || []).filter(m =>
                (m.sender_id === currentUser.id && m.receiver_id === selectedUser.id) ||
                (m.sender_id === selectedUser.id && m.receiver_id === currentUser.id)
            );
            setMessages(list);
            if (list.length > 0) lastMessageTimeRef.current = list[list.length - 1].created_at;
            setShouldAutoScroll(true);
        } catch (e) {
            console.error(e);
        }
    };

    const setupRealtime = () => {
        if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
        const channel = supabase
            .channel(`contractor-messages-${currentUser.id}-${Date.now()}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUser.id}` }, payload => handleIncoming(payload.new))
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, payload => handleIncoming(payload.new))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${currentUser.id}` }, payload => handleUpdate(payload.new))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, payload => handleUpdate(payload.new))
            .subscribe();
        realtimeChannelRef.current = channel;
    };

    const handleIncoming = (newMessage) => {
        const cur = currentUserRef.current;
        const sel = selectedUserRef.current;
        if (!cur) return;
        fetchConversations();
        const inCurrent = sel && ((newMessage.sender_id === cur.id && newMessage.receiver_id === sel.id) || (newMessage.sender_id === sel.id && newMessage.receiver_id === cur.id));
        if (inCurrent) {
            setMessages(prev => prev.some(m => m.id === newMessage.id) ? prev : [...prev.filter(m => !(m.id && String(m.id).startsWith('temp-') && m.content === newMessage.content)), newMessage]);
            lastMessageTimeRef.current = newMessage.created_at;
            setShouldAutoScroll(true);
            if (newMessage.sender_id !== cur.id) {
                markMessagesAsRead();
            }
            silentRefreshMessages();
        }
    };

    const handleUpdate = (updatedMessage) => {
        const cur = currentUserRef.current;
        const sel = selectedUserRef.current;
        if (!cur || !sel) return;
        const inCurrent = ((updatedMessage.sender_id === cur.id && updatedMessage.receiver_id === sel.id) || (updatedMessage.sender_id === sel.id && updatedMessage.receiver_id === cur.id));
        if (inCurrent) setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
    };

    const handleSend = async () => {
        if (!message.trim() || !currentUser || !selectedUser || sendingMessage) return;
        const content = message.trim();
        setMessage("");
        const temp = { id: `temp-${Date.now()}`, sender_id: currentUser.id, receiver_id: selectedUser.id, content, created_at: new Date().toISOString(), read_at: null };
        setMessages(prev => [...prev, temp]);
        setShouldAutoScroll(true);
        // Keep focus on the input
        messageInputRef.current?.focus();
        try {
            setSendingMessage(true);
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sendMessage', params: { senderId: currentUser.id, receiverId: selectedUser.id, content } })
            });
            if (!res.ok) throw new Error('Failed to send');
            const json = await res.json();
            setMessages(prev => prev.map(m => m.id === temp.id ? json.message : m));
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.filter(m => m.id !== temp.id));
            setMessage(content);
        } finally {
            setSendingMessage(false);
            // Restore focus
            messageInputRef.current?.focus();
        }
    };

    const markMessagesAsRead = async () => {
        if (!currentUser || !selectedUser) return;
        try {
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markRead', params: { receiverId: currentUser.id, senderId: selectedUser.id } })
            });
            fetchConversations();
        } catch (e) {
            console.error(e);
        }
    };

    // Auto-refresh helpers
    const startAutoRefresh = () => {
        stopAutoRefresh();
        autoRefreshIntervalRef.current = setInterval(() => {
            silentRefreshConversations();
            if (selectedUser) {
                silentRefreshMessages();
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
            const res = await fetch(`/api/admin?action=conversations&userId=${currentUser.id}`);
            if (res.ok) {
                const data = await res.json();
                const newConvs = data.conversations || [];
                setConversations(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(newConvs)) return newConvs;
                    return prev;
                });
            }
        } catch (_) {}
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
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const newMessages = data.messages || [];
            if (newMessages.length > 0) {
                const filtered = newMessages.filter(msg =>
                    (msg.sender_id === currentUser.id && msg.receiver_id === selectedUser.id) ||
                    (msg.sender_id === selectedUser.id && msg.receiver_id === currentUser.id)
                );
                if (filtered.length > 0) {
                    lastMessageTimeRef.current = filtered[filtered.length - 1].created_at;
                    setMessages(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        const trulyNew = filtered.filter(m => !existingIds.has(m.id));
                        if (trulyNew.length > 0) {
                            const filteredPrev = prev.filter(m => !(m.id && String(m.id).startsWith('temp-')));
                            const updated = [...filteredPrev, ...trulyNew];
                            setShouldAutoScroll(true);
                            return updated;
                        }
                        return prev;
                    });
                    const fromOther = filtered.filter(m => m.sender_id !== currentUser.id);
                    if (fromOther.length > 0) {
                        markMessagesAsRead();
                    }
                }
            }
        } catch (e) {
            console.log('silent refresh error', e);
        }
    };

    // UI helpers
    const formatConversationTime = (ts) => {
        const date = new Date(ts); const now = new Date();
        const diffH = (now - date) / (1000 * 60 * 60);
        if (diffH < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffH < 48) return 'Yesterday';
        return date.toLocaleDateString();
    };
    const formatMessageTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isOwnMessage = (msg) => msg.sender_id === currentUser?.id;
    const isTempMessage = (msg) => msg.id && String(msg.id).startsWith('temp-');
    const isMessageRead = (msg) => msg.read_at !== null;
    const getSenderLabel = (conv) => conv.isOwnMessage ? 'You' : (conv.name.split(' ')[0] || conv.name);
    const handleSearchChange = (e, value) => {
        setSearchQuery(value);
        if (!value) { setFilteredUsers(users); return; }
        const v = value.toLowerCase();
        setFilteredUsers(users.filter(u => u.name.toLowerCase().includes(v) || u.email.toLowerCase().includes(v)));
    };
    const handleUserSelect = (e, user) => { setSelectedUser(user); setSearchQuery(user ? user.name : ""); };
    const handleConversationSelect = (conv) => { const u = users.find(x => x.id === conv.id); if (u) setSelectedUser(u); };
    const getMessageAvatarUrl = (msg) => {
        if (!currentUser || !selectedUser) return null;
        const senderId = msg.sender_id;
        if (senderId === currentUser.id) return currentUser.avatarUrl || null;
        if (senderId === selectedUser.id) return selectedUser.avatarUrl || null;
        const found = users.find(u => u.id === senderId);
        return found?.avatarUrl || null;
    };
    const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
    const handleSnackbarClose = () => setSnackbar(prev => ({ ...prev, open: false }));

    // Message handlers (removed old mock handler, using async handleSend defined above)

    // Styles
    const mainContainerStyles = { position: "absolute", top: 0, left: "72px", right: 0, bottom: 0, display: "flex", bgcolor: theme.palette.background.default };
    const sidebarStyles = { width: "350px", borderRight: "1px solid", borderColor: "divider", bgcolor: theme.palette.background.paper, display: "flex", flexDirection: "column", p: 2, gap: 2 };
    const searchFieldStyles = { bgcolor: theme.palette.background.default, borderRadius: 2 };
    const conversationsContainerStyles = { flexGrow: 1, overflow: "auto", display: "flex", flexDirection: "column", gap: 1 };
    const conversationItemStyles = { p: 1.5, display: "flex", alignItems: "center", gap: 1, borderRadius: 2, bgcolor: theme.palette.background.default, cursor: "pointer", "&:hover": { bgcolor: theme.palette.action.hover } };
    const nameStyles = { fontSize: "14px", fontWeight: "bold" };
    const messageLineStyles = { fontSize: "12px", color: "text.secondary", noWrap: true };
    const timeStyles = { fontSize: "10px", color: "text.secondary" };
    const unreadBadgeStyles = { bgcolor: "primary.main", color: "white", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", mx: "auto" };
    const chatAreaStyles = { flexGrow: 1, display: "flex", flexDirection: "column", bgcolor: theme.palette.background.default };
    const headerStyles = { p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" };
    const messagesContainerStyles = { flexGrow: 1, p: 2, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 };
    const bubbleBase = { p: 2, borderRadius: 2, maxWidth: "50%", display: "inline-block", position: "relative", wordBreak: "break-word", overflowWrap: "anywhere", whiteSpace: "pre-wrap" };
    const receivedMessageStyles = {
        ...bubbleBase,
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
        ...bubbleBase,
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
        <Box sx={mainContainerStyles}>
            <Box sx={sidebarStyles}>
                <Autocomplete
                    freeSolo
                    options={filteredUsers}
                    getOptionLabel={(option) => typeof option === 'string' ? option : (option.name || '')}
                    inputValue={searchQuery}
                    onInputChange={handleSearchChange}
                    onChange={handleUserSelect}
                    loading={loadingUsers}
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
                                        {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
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
                
                {/* Conversations */}
                <Box sx={conversationsContainerStyles}>
                    {conversations.length === 0 ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "text.secondary" }}>
                            <Typography>No conversations yet</Typography>
                        </Box>
                    ) : (
                        conversations.map((conv) => (
                            <Paper key={conv.id} sx={conversationItemStyles} onClick={() => handleConversationSelect(conv)}>
                                <Avatar src={conv.avatarUrl || undefined}>
                                    {(!conv.avatarUrl && conv.name) ? conv.name.charAt(0) : ''}
                                </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                    <Typography sx={nameStyles}>{conv.name}</Typography>
                                    <Typography sx={messageLineStyles}>
                                        {getSenderLabel(conv)}: {conv.lastMessage}
                                    </Typography>
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                                    <Typography sx={timeStyles}>{formatConversationTime(conv.lastMessageTime)}</Typography>
                                    {conv.unreadCount > 0 && <Box sx={unreadBadgeStyles}>{conv.unreadCount}</Box>}
                            </Box>
                        </Paper>
                        ))
                    )}
                </Box>
            </Box>

            <Box sx={chatAreaStyles}>
                <Box sx={headerStyles}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar src={selectedUser?.avatarUrl || undefined}>
                            {selectedUser ? (!selectedUser.avatarUrl && selectedUser.name.charAt(0)) : ""}
                        </Avatar>
                        <Box>
                            <Typography sx={{ fontWeight: "bold" }}>{selectedUser ? selectedUser.name : "Select a conversation"}</Typography>
                            <Typography sx={{ fontSize: "12px", color: selectedUser ? (selectedUser.user_status_id === 1 ? 'success.main' : 'text.secondary') : 'text.secondary' }}>
                                {selectedUser ? (selectedUser.user_status_id === 1 ? 'Online' : 'Offline') : 'No active chat'}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton disabled={!selectedUser}><MoreVertIcon /></IconButton>
                </Box>

                <Box sx={messagesContainerStyles}>
                    {selectedUser ? (
                        messages.length > 0 ? (
                            <>
                                {messages.map((msg, idx) => (
                                    <Box key={msg.id || idx} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexDirection: isOwnMessage(msg) ? 'row-reverse' : 'row' }}>
                                        <Avatar sx={{ width: 28, height: 28 }} src={getMessageAvatarUrl(msg) || undefined}>
                                            {!getMessageAvatarUrl(msg) && (isOwnMessage(msg) ? (currentUser?.name?.charAt(0) || '') : (selectedUser?.name?.charAt(0) || ''))}
                                        </Avatar>
                                        <Box sx={isOwnMessage(msg) ? (isTempMessage(msg) ? tempMessageStyles : sentMessageStyles) : receivedMessageStyles}>
                                            <Typography sx={messageTextStyles}>{msg.content}</Typography>
                                            <Typography sx={messageTimeStyles}>{formatMessageTime(msg.created_at)}</Typography>
                                            {isOwnMessage(msg) && !isTempMessage(msg) && (
                                                <Typography sx={messageStatusStyles}>{isMessageRead(msg) ? '✓ Read' : '✓ Sent'}</Typography>
                                            )}
                                            {isTempMessage(msg) && (
                                                <Typography sx={messageStatusStyles}>Sending...</Typography>
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
                        onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        sx={inputFieldStyles}
                        disabled={!selectedUser}
                        inputRef={messageInputRef}
                    />
                    <IconButton color="primary" onClick={handleSend} disabled={!selectedUser || !message.trim() || sendingMessage}>
                        {sendingMessage ? <CircularProgress size={20} /> : <SendIcon />}
                    </IconButton>
                </Box>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}