import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { contactsApi, groupsApi, statusApi, profileApi } from '../services/api';
import xmtpService from '../services/xmtpService';
import { ipfsService } from '../services/ipfsService';
import './MessagingPage.css';

export default function MessagingPage() {
  const { isConnected, isLoading, connectWallet, wallet, isXMTPReady } = useApp();
  const [selectedContact, setSelectedContact] = useState(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Profile and Status states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStatusViewer, setShowStatusViewer] = useState(null);
  const [userProfile, setUserProfile] = useState({
    avatar: '👤',
    name: 'You',
    about: 'Hey there! I am using CIVITAS'
  });
  const [statusText, setStatusText] = useState('');
  const [statuses, setStatuses] = useState([]);
  const profilePicInputRef = useRef(null);
  
  // Group states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('👥');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groups, setGroups] = useState([]);
  
  // Call states
  const [callState, setCallState] = useState(null); // 'idle', 'calling', 'ringing', 'active', 'ended'
  const [callType, setCallType] = useState(null); // 'voice' or 'video'
  const [incomingCall, setIncomingCall] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const callTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [contacts, setContacts] = useState([]);

  const [messages, setMessages] = useState([]);

  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatAddress, setNewChatAddress] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const searchTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Call duration timer
    if (callState === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callState]);

  useEffect(() => {
    // Simulate typing indicator
    if (isTyping) {
      const timer = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // Load contacts from backend
  useEffect(() => {
    if (wallet?.address) {
      loadContacts();
      loadGroups();
      loadStatuses();
      loadProfile();
    }
  }, [wallet?.address]);

  // Load XMTP conversations when XMTP becomes ready
  useEffect(() => {
    if (isXMTPReady) {
      console.log('✅ XMTP ready for messaging');
      loadXMTPConversations();

      // Listen for incoming call signals from any peer (V3: async iterable)
      (async () => {
        try {
          const stream = await xmtpService.client?.conversations?.streamAllMessages();
          if (!stream) return;
          for await (const msg of stream) {
            if (typeof msg.content !== 'string') continue;
            try {
              const data = JSON.parse(msg.content);
              const senderAddr = msg.senderAddress || msg.senderInboxId || '';
              if (data.type === 'call_invite' && data.from?.toLowerCase() !== wallet?.address?.toLowerCase()) {
                setIncomingCall({
                  from: senderAddr,
                  callType: data.callType,
                  contact: contacts.find(c => c.address?.toLowerCase() === senderAddr.toLowerCase()) || {
                    name: senderAddr.slice(0, 6) + '…' + senderAddr.slice(-4),
                    avatar: '👤',
                    address: senderAddr
                  }
                });
              }
            } catch (_) {}
          }
        } catch (err) {
          console.warn('Call signal stream unavailable:', err.message);
        }
      })();
    }
  }, [isXMTPReady]);

  // Load messages when contact is selected
  useEffect(() => {
    if (selectedContact && isXMTPReady) {
      setMessages([]);
      if (!selectedContact.isGroup) {
        loadXMTPMessages();
      }
      // Group messaging uses backend REST — load from /api/messages?groupId=
    }
  }, [selectedContact?.address, selectedContact?.id, isXMTPReady]);

  // Backend loading functions
  const loadContacts = async () => {
    try {
      const response = await contactsApi.getContacts(wallet.address);
      const rawContacts = response.data?.contacts || response.data || [];
      const contactsData = rawContacts.map((contact, idx) => ({
        id: contact.walletAddress || `contact-${idx}`,
        address: contact.walletAddress,
        name: contact.name || contact.walletAddress?.slice(0, 8) || 'Unknown',
        lastMessage: contact.lastMessage || '',
        time: contact.lastMessageTime ? new Date(contact.lastMessageTime).toLocaleString() : '',
        unread: contact.unreadCount || 0,
        online: contact.isOnline || false,
        lastSeen: contact.lastSeen ? new Date(contact.lastSeen).toLocaleString() : '',
        avatar: contact.avatar || '👤',
        archived: contact.archived || false,
        pinned: contact.pinned || false,
        hasStatus: false
      }));
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await groupsApi.getGroups(wallet.address);
      const rawGroups = response.data?.groups || response.data || [];
      const groupsData = rawGroups.map(group => ({
        id: group.id || group._id,
        name: group.name,
        icon: group.icon || '👥',
        members: group.members || [],
        lastMessage: group.lastMessage || '',
        time: group.lastMessageTime ? new Date(group.lastMessageTime).toLocaleString() : '',
        unread: group.unreadCount || 0,
        isGroup: true,
        admin: group.creator || group.admin
      }));
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadStatuses = async () => {
    try {
      const response = await statusApi.getStatuses(wallet.address);
      const { myStatuses = [], contactStatuses = [] } = response.data;
      const allStatuses = [...myStatuses, ...contactStatuses];
      const statusesData = allStatuses.map(status => ({
        id: status.id || status._id,
        contactId: status.userId?.toLowerCase(),
        content: status.content,
        timestamp: status.createdAt || new Date(status.timestamp).getTime(),
        backgroundColor: status.backgroundColor || '#00a884',
        viewed: status.views?.some(v => v.userId === wallet.address.toLowerCase()) || false,
        mediaUrl: status.mediaUrl
      }));
      setStatuses(statusesData);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await profileApi.getProfile(wallet.address);
      const p = response.data?.profile || response.data;
      if (p) {
        setUserProfile({
          avatar: p.avatar || '👤',
          name: p.name || 'You',
          about: p.about || 'Hey there! I am using CIVITAS'
        });
      }
    } catch (error) {
      console.warn('Profile not loaded (first time user):', error.message);
    }
  };

  const saveProfile = async () => {
    try {
      await profileApi.updateProfile(wallet.address, userProfile.name, userProfile.about, userProfile.avatar);
      setShowProfileModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // Load all XMTP conversations and populate contacts
  const loadXMTPConversations = async () => {
    try {
      const conversations = await xmtpService.listConversations();
      if (conversations.length === 0) return;

      const xmtpContacts = await Promise.all(conversations.map(async (conv, idx) => {
        let lastMsg = '';
        let lastTime = '';
        try {
          const msgs = await conv.messages({ limit: 1 });
          if (msgs.length > 0) {
            lastMsg = typeof msgs[0].content === 'string'
              ? msgs[0].content.slice(0, 60)
              : '📎 Attachment';
            lastTime = new Date(msgs[0].sent).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit'
            });
          }
        } catch (_) {}
        return {
          id: `xmtp-${idx}`,
          address: conv.peerAddress,
          name: conv.peerAddress.slice(0, 6) + '…' + conv.peerAddress.slice(-4),
          lastMessage: lastMsg,
          time: lastTime,
          unread: 0,
          online: false,
          avatar: '👤',
          archived: false,
          pinned: false,
          hasStatus: false
        };
      }));

      setContacts(prev => {
        // Merge: keep backend contacts but add any XMTP-only ones
        const existingAddresses = new Set(prev.map(c => c.address?.toLowerCase()));
        const newOnes = xmtpContacts.filter(c => !existingAddresses.has(c.address.toLowerCase()));
        return [...prev, ...newOnes];
      });
    } catch (error) {
      console.error('Error loading XMTP conversations:', error);
    }
  };

  // Search for users by name or address when typing in new-chat dialog
  const handleNewChatSearch = (value) => {
    setNewChatAddress(value);
    setSearchResults([]);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.length < 2) return;
    // If it's a full Eth address, skip search — they'll click Chat
    if (/^0x[0-9a-fA-F]{40}$/.test(value.trim())) return;
    setIsSearchingUsers(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const response = await contactsApi.searchUsers(value, wallet.address);
        setSearchResults(response.data?.users || []);
      } catch (err) {
        console.error('User search error:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };

  // Start a new chat — either from search result or raw address
  const startChatWith = async (address, displayName) => {
    const addr = address.trim().toLowerCase();
    if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      alert('Invalid Ethereum address.');
      return;
    }
    if (!isXMTPReady) {
      alert('XMTP is not ready. Please connect your wallet first.');
      return;
    }

    // Check XMTP reachability
    const canMsg = await xmtpService.canMessage(addr);
    if (!canMsg) {
      alert(`${displayName || addr} is not registered on XMTP yet. They need to connect their wallet to CIVITAS (or any XMTP-enabled app) first.`);
      return;
    }

    // Persist contact to backend
    try {
      await contactsApi.addContact(wallet.address, addr, displayName || addr.slice(0, 6) + '…' + addr.slice(-4));
    } catch (err) {
      console.warn('Could not persist contact:', err);
    }

    const contact = {
      id: `xmtp-${addr}`,
      address: addr,
      name: displayName || addr.slice(0, 6) + '…' + addr.slice(-4),
      lastMessage: '',
      time: '',
      unread: 0,
      online: false,
      avatar: '👤',
      archived: false,
      pinned: false,
      hasStatus: false
    };
    setContacts(prev => {
      const exists = prev.find(c => c.address?.toLowerCase() === addr);
      return exists ? prev : [contact, ...prev];
    });
    setSelectedContact(contact);
    setShowNewChat(false);
    setNewChatAddress('');
    setSearchResults([]);
  };

  // Start a new XMTP chat with any wallet address
  const handleNewChat = async () => {
    const addr = newChatAddress.trim();
    if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      alert('Please enter a valid Ethereum address (42 characters starting with 0x)');
      return;
    }
    await startChatWith(addr);
  };

  // Parse an XMTP message into display format
  const parseXMTPMessage = (msg, myAddress) => {
    let content = msg.content;
    let type = 'text';
    let fileData = null;

    // Handle JSON content (file / voice / reply)
    if (typeof content === 'string' && content.startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.type === 'file' || parsed.type === 'image') {
          type = parsed.type === 'image' ? 'image' : 'file';
          fileData = parsed;
          content = `📎 ${parsed.name} (${(parsed.size / 1024).toFixed(1)} KB)`;
        } else if (parsed.type === 'voice') {
          type = 'voice';
          fileData = parsed;
          content = `🎤 Voice message (${parsed.duration}s)`;
        } else if (parsed.text && parsed.replyTo) {
          // Reply message — extract text and reply context
          content = parsed.text;
        }
      } catch (_) {}
    }

    return {
      id: msg.id,
      sender: msg.sender.toLowerCase() === myAddress.toLowerCase() ? 'me' : 'them',
      content,
      time: new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'delivered',
      type,
      fileData,
      replyTo: (() => { try { const p = JSON.parse(msg.content); return p.replyTo || null; } catch { return null; } })(),
      reactions: [],
      starred: false,
      timestamp: msg.timestamp
    };
  };

  const loadXMTPMessages = async () => {
    try {
      if (!xmtpService.isReady()) {
        console.warn('XMTP not ready yet');
        return;
      }
      setIsLoadingMessages(true);
      const peerAddress = selectedContact.address;
      const xmtpMessages = await xmtpService.getMessages(peerAddress);
      setMessages(xmtpMessages.map(m => parseXMTPMessage(m, wallet.address)));
      setIsLoadingMessages(false);

      // Live-stream new messages
      xmtpService.onMessage(peerAddress, (newMessage) => {
        setMessages(prev => {
          // Deduplicate by id
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, parseXMTPMessage(newMessage, wallet.address)];
        });
      });
    } catch (error) {
      console.error('Error loading XMTP messages:', error);
      setIsLoadingMessages(false);
    }
  };

  // XMTP event handlers removed - XMTP handles delivery automatically
  // No need for: handleNewMessage, handleMessageUpdate, handleMessageDelete, 
  // handleTypingIndicator, handleUserOnline, handleUserOffline, handleMessageRead
  // XMTP provides end-to-end encryption, no server-side processing needed

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    window.addEventListener('click', dismiss);
    return () => window.removeEventListener('click', dismiss);
  }, [contextMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    // If editing, update instead of sending (note: XMTP doesn't support editing)
    if (editingMessage) {
      alert('XMTP does not support editing messages. Send a new message instead.');
      setEditingMessage(null);
      setMessage('');
      return;
    }

    if (!message.trim() && !selectedFile) return;

    // Group messaging not yet supported via XMTP
    if (selectedContact?.isGroup) {
      alert('Group messaging is coming soon. For now, use direct messages.');
      return;
    }

    if (!isXMTPReady) {
      alert('XMTP messaging not initialized. Please wait...');
      return;
    }

    try {
      // Check if peer can receive XMTP messages
      const canMessage = await xmtpService.canMessage(selectedContact.address);
      if (!canMessage) {
        alert(`${selectedContact.name} is not registered on XMTP network. They need to connect their wallet to CIVITAS first.`);
        return;
      }

      let messageContent = message;
      let contentType = 'text/plain';
      let fileMetadata = null;

      // Handle file sending via IPFS + XMTP
      if (selectedFile) {
        console.log('📤 Uploading file to IPFS...');
        const { cid, url } = await ipfsService.uploadFile(selectedFile);
        fileMetadata = {
          type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
          name: selectedFile.name,
          size: selectedFile.size,
          mimeType: selectedFile.type,
          cid,
          url
        };
        messageContent = fileMetadata; // Pass object — xmtpService.sendMessage will stringify once
        contentType = 'application/json';
      }

      // Include reply context in the XMTP payload
      if (replyingTo && typeof messageContent === 'string') {
        messageContent = JSON.stringify({
          text: messageContent,
          replyTo: { id: replyingTo.id, content: replyingTo.content, sender: replyingTo.sender }
        });
      }

      // Send via XMTP (automatically encrypted end-to-end)
      const sentMessage = await xmtpService.sendMessage(
        selectedContact.address,
        messageContent,
        contentType
      );

      const msgType = selectedFile
        ? (selectedFile.type.startsWith('image/') ? 'image' : 'file')
        : 'text';

      // Optimistically add to UI
      const newMessage = {
        id: sentMessage.id,
        sender: 'me',
        content: selectedFile ? `📎 ${selectedFile.name}` : message,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
        type: msgType,
        fileData: fileMetadata,
        reactions: [],
        starred: false,
        replyTo: replyingTo,
        timestamp: Date.now()
      };

      setMessages([...messages, newMessage]);
      setMessage('');
      setSelectedFile(null);
      setReplyingTo(null);

      console.log('✅ Message sent via XMTP');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleVoiceRecord = async () => {
    if (recording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecording(false);
      setRecordingDuration(0);
    } else {
      if (!isXMTPReady || !selectedContact) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const duration = recordingDuration;

          // Optimistic UI
          const tempId = `voice-${Date.now()}`;
          const voiceMsg = {
            id: tempId,
            sender: 'me',
            content: `🎤 Voice message (${duration}s)`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'sending',
            type: 'voice',
            fileData: { duration },
            reactions: [],
            starred: false,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, voiceMsg]);

          try {
            const sentMessage = await xmtpService.sendVoiceMessage(
              selectedContact.address,
              audioBlob,
              duration,
              (file) => ipfsService.uploadFile(file)
            );
            setMessages(prev => prev.map(m =>
              m.id === tempId ? { ...m, id: sentMessage.id, status: 'sent' } : m
            ));
          } catch (err) {
            console.error('Error sending voice message:', err);
            setMessages(prev => prev.map(m =>
              m.id === tempId ? { ...m, status: 'failed' } : m
            ));
          }
        };

        mediaRecorder.start();
        setRecording(true);
        setRecordingDuration(0);
        recordingTimerRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Microphone access is required for voice messages.');
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleReact = (messageId, emoji) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions.map(r => 
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            )
          };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1 }]
          };
        }
      }
      return msg;
    }));
    setContextMenu(null);
  };

  const handleDeleteMessage = (messageId) => {
    alert('XMTP messages are immutable and cannot be deleted from the protocol. This maintains message integrity and prevents tampering.');
    setContextMenu(null);
  };

  const handleEditMessage = (messageId) => {
    alert('XMTP messages are immutable and cannot be edited. This maintains message integrity. Send a new message instead.');
    setContextMenu(null);
  };

  const handleUpdateMessage = () => {
    // XMTP doesn't support message editing - messages are immutable
    alert('XMTP does not support editing messages. Send a new message instead.');
    setEditingMessage(null);
    setMessage('');
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessage('');
  };

  const handleStarMessage = (messageId) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, starred: !msg.starred } : msg
    ));
    setContextMenu(null);
  };

  const handleArchiveContact = (contactId) => {
    setContacts(contacts.map(c => 
      c.id === contactId ? { ...c, archived: !c.archived } : c
    ));
  };

  // Call handlers — WebRTC calls require a signaling server.
  // XMTP can carry signaling messages; this is a scaffold for future WebRTC integration.
  const startCall = async (type) => {
    if (!selectedContact) return;
    if (!isXMTPReady) {
      alert('Connect your wallet first to make calls.');
      return;
    }
    // Send call-invite signal via XMTP so peer knows you are calling
    try {
      await xmtpService.sendMessage(
        selectedContact.address,
        JSON.stringify({ type: 'call_invite', callType: type, from: wallet.address, timestamp: Date.now() }),
        'application/json'
      );
    } catch (_) {}
    setCallType(type);
    setCallState('calling');
    // Auto-cancel after 30s if no answer (peer not online)
    setTimeout(() => {
      setCallState(prev => {
        if (prev === 'calling') {
          setTimeout(() => setCallState(null), 2000);
          return 'ended';
        }
        return prev;
      });
    }, 30000);
  };

  const endCall = () => {
    // Send end-call signal via XMTP
    if (selectedContact && isXMTPReady) {
      xmtpService.sendMessage(
        selectedContact.address,
        JSON.stringify({ type: 'call_end', from: wallet.address, timestamp: Date.now() }),
        'application/json'
      ).catch(() => {});
    }
    setCallState('ended');
    setIsVideoEnabled(true);
    setIsMuted(false);
    setTimeout(() => { setCallState(null); setCallType(null); }, 2000);
  };

  const answerCall = () => {
    if (!incomingCall) return;
    setCallState('active');
    setCallType(incomingCall.callType);
    setIncomingCall(null);
    if (incomingCall.callType === 'video') simulateVideoStream();
  };

  const rejectCall = () => {
    setIncomingCall(null);
    setCallState(null);
  };

  const toggleMute = () => setIsMuted(prev => !prev);
  const toggleVideo = () => setIsVideoEnabled(prev => !prev);

  const simulateVideoStream = () => {
    // Simulate video stream (in real app, use WebRTC)
    if (localVideoRef.current && remoteVideoRef.current) {
      localVideoRef.current.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      remoteVideoRef.current.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate incoming call (demo)
  const simulateIncomingCall = (type) => {
    if (selectedContact) {
      setIncomingCall({
        contact: selectedContact,
        type: type
      });
    }
  };

  // Profile and Status handlers
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicEmoji = (emoji) => {
    setUserProfile({ ...userProfile, avatar: emoji });
  };

  const handlePostStatus = async () => {
    if (!statusText.trim()) return;

    const colors = ['#00a884', '#667eea', '#f5576c', '#f093fb', '#764ba2', '#ff6b6b', '#4ecdc4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    try {
      const response = await statusApi.postStatus(
        wallet.address,
        userProfile.name || wallet.address.slice(0, 8),
        userProfile.avatar || '👤',
        'text',
        statusText,
        null, // mediaUrl
        randomColor
      );

      const newStatus = {
        id: response.data?.status?.id || response.data?.id || `st_${Date.now()}`,
        contactId: wallet.address.toLowerCase(),
        content: statusText,
        timestamp: Date.now(),
        backgroundColor: randomColor,
        viewed: false
      };

      setStatuses([newStatus, ...statuses]);
      setStatusText('');
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error posting status:', error);
      alert('Failed to post status. Please try again.');
    }
  };

  const viewStatus = async (contactId) => {
    const contactStatuses = statuses.filter(s => s.contactId === contactId);
    if (contactStatuses.length > 0) {
      setShowStatusViewer({
        contactId,
        statuses: contactStatuses,
        currentIndex: 0
      });
      
      // Mark as viewed on backend
      try {
        for (const status of contactStatuses) {
          if (!status.viewed) {
            await statusApi.viewStatus(status.id, wallet.address);
          }
        }
        // Mark as viewed in local state
        setStatuses(statuses.map(s => 
          s.contactId === contactId ? { ...s, viewed: true } : s
        ));
      } catch (error) {
        console.error('Error marking status as viewed:', error);
      }
    }
  };

  const nextStatus = () => {
    if (showStatusViewer && showStatusViewer.currentIndex < showStatusViewer.statuses.length - 1) {
      setShowStatusViewer({
        ...showStatusViewer,
        currentIndex: showStatusViewer.currentIndex + 1
      });
    } else {
      setShowStatusViewer(null);
    }
  };

  const prevStatus = () => {
    if (showStatusViewer && showStatusViewer.currentIndex > 0) {
      setShowStatusViewer({
        ...showStatusViewer,
        currentIndex: showStatusViewer.currentIndex - 1
      });
    }
  };

  const hasUnviewedStatus = (contactId) => {
    return statuses.some(s => s.contactId === contactId && !s.viewed);
  };

  const getMyStatuses = () => {
    return statuses.filter(s => s.contactId === wallet?.address?.toLowerCase());
  };

  // Group handlers
  const toggleMemberSelection = (contactId) => {
    if (selectedMembers.includes(contactId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== contactId));
    } else {
      setSelectedMembers([...selectedMembers, contactId]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) {
      alert('Please enter a group name and select at least 2 members.');
      return;
    }

    try {
      // Get member addresses
      const memberAddresses = selectedMembers.map(memberId => {
        const contact = contacts.find(c => c.id === memberId);
        return contact?.address;
      }).filter(Boolean);

      // Add creator to members
      memberAddresses.push(wallet.address);

      const response = await groupsApi.createGroup(
        wallet.address,
        groupName,
        groupIcon,
        '',
        memberAddresses
      );

      const newGroup = {
        id: response.data?.group?.id || response.data?._id || `grp-${Date.now()}`,
        name: groupName,
        icon: groupIcon,
        members: memberAddresses,
        lastMessage: 'Group created',
        time: 'Now',
        unread: 0,
        isGroup: true,
        admin: wallet.address,
        createdAt: Date.now()
      };

      setGroups([newGroup, ...groups]);
      setGroupName('');
      setGroupIcon('👥');
      setSelectedMembers([]);
      setShowGroupModal(false);
      setSelectedContact(newGroup);
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const getGroupMembers = (group) => {
    if (!group.members) return [];
    return contacts.filter(c => group.members.includes(c.address?.toLowerCase()));
  };

  const getMemberNames = (group) => {
    const members = getGroupMembers(group);
    if (members.length === 0 && group.members) {
      return group.members.map(addr => addr.slice(0, 6) + '…' + addr.slice(-4)).join(', ');
    }
    return members.map(m => m.name).join(', ');
  };

  const getMessageStatus = (status) => {
    switch(status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '🕐';
    }
  };

  const filteredContacts = contacts
    .filter(c => !c.archived)
    .filter(c => searchQuery ? 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  const filteredGroups = groups.filter(g => 
    searchQuery ? g.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const filteredMessages = showSearch && searchQuery ? 
    messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())) : 
    messages;
    
  if (isLoading) {
    return (
      <div className="messaging-page">
        <div className="messaging-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="messaging-page">
        <div className="messaging-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to access encrypted messaging.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messaging-page">
      <div className="messaging-container">
        {/* Contacts Panel */}
        <div className="contacts-panel">
          <div className="panel-header">
            <div 
              className="user-profile-section"
              onClick={() => setShowProfileModal(true)}
            >
              <div className="user-avatar">
                {typeof userProfile.avatar === 'string' && userProfile.avatar.startsWith('data:') ? (
                  <img src={userProfile.avatar} alt="Profile" />
                ) : (
                  <span>{userProfile.avatar}</span>
                )}
              </div>
              <h2>Messages</h2>
            </div>
            <div className="header-actions">
              <button 
                className="icon-btn" 
                onClick={() => setShowStatusModal(true)}
                title="Post Status"
              >
                📝
              </button>
              <button 
                className="icon-btn" 
                onClick={() => setShowSearch(!showSearch)}
                title="Search"
              >
                🔍
              </button>
              <button 
                className="icon-btn" 
                onClick={() => setShowGroupModal(true)}
                title="New Group"
              >
                👥
              </button>
              <button 
                className="icon-btn" 
                onClick={() => setShowNewChat(true)}
                title="New Chat (enter wallet address)"
                style={{ background: isXMTPReady ? 'rgba(0,200,100,0.15)' : 'rgba(255,170,0,0.15)' }}
              >
                {isXMTPReady ? '✉️' : '⏳'}
              </button>
            </div>
          </div>

          {/* New Chat Dialog */}
          {showNewChat && (
            <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ marginBottom: 8, fontSize: 13, color: '#aaa' }}>
                {isXMTPReady ? '🔒 Search by name or paste a wallet address' : '⏳ Waiting for XMTP to initialize...'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search name or 0x address..."
                  value={newChatAddress}
                  onChange={e => handleNewChatSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && /^0x[0-9a-fA-F]{40}$/.test(newChatAddress.trim()) && handleNewChat()}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: 13 }}
                  disabled={!isXMTPReady}
                  autoFocus
                />
                {/^0x[0-9a-fA-F]{40}$/.test(newChatAddress.trim()) && (
                  <button onClick={handleNewChat} disabled={!isXMTPReady} style={{ padding: '8px 16px', borderRadius: 8, background: '#00a884', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Chat
                  </button>
                )}
                <button onClick={() => { setShowNewChat(false); setNewChatAddress(''); setSearchResults([]); }} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
              {/* Search Results */}
              {isSearchingUsers && (
                <div style={{ padding: '12px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>Searching...</div>
              )}
              {searchResults.length > 0 && (
                <div style={{ maxHeight: 240, overflowY: 'auto', marginTop: 8 }}>
                  {searchResults.map((user) => (
                    <div
                      key={user.walletAddress}
                      onClick={() => startChatWith(user.walletAddress, user.name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                        background: 'rgba(255,255,255,0.04)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                        {user.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{user.name}</div>
                        <div style={{ color: '#888', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.walletAddress}
                        </div>
                      </div>
                      {user.isOnline && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00c853', flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              )}
              {!isSearchingUsers && newChatAddress.length >= 2 && searchResults.length === 0 && !/^0x[0-9a-fA-F]{40}$/.test(newChatAddress.trim()) && (
                <div style={{ padding: '12px 0', textAlign: 'center', color: '#888', fontSize: 13 }}>
                  No users found. Paste a full 0x address to chat directly.
                </div>
              )}
            </div>
          )}

          {/* My Status Section */}
          {getMyStatuses().length > 0 && (
            <div className="my-status-section">
              <div 
                className="status-item my-status"
                onClick={() => viewStatus(wallet?.address?.toLowerCase())}
              >
                <div className="status-avatar-wrapper">
                  <div className="status-avatar">
                    {typeof userProfile.avatar === 'string' && userProfile.avatar.startsWith('data:') ? (
                      <img src={userProfile.avatar} alt="Your status" />
                    ) : (
                      <span>{userProfile.avatar}</span>
                    )}
                  </div>
                </div>
                <div className="status-info">
                  <h4>My Status</h4>
                  <p>{new Date(getMyStatuses()[0].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            </div>
          )}

          {showSearch && (
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="contacts-list">
            {/* Groups Section */}
            {filteredGroups.length > 0 && (
              <div className="groups-section">
                <div className="section-header">
                  <span>👥 Groups</span>
                </div>
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`contact-item group-item ${selectedContact?.id === group.id ? 'active' : ''}`}
                    onClick={() => setSelectedContact(group)}
                  >
                    <div className="contact-avatar group-avatar">
                      {group.icon}
                    </div>
                    <div className="contact-info">
                      <div className="contact-header">
                        <h3>{group.name}</h3>
                        <span className="contact-time">{group.time}</span>
                      </div>
                      <p className="contact-last-message">{group.lastMessage}</p>
                    </div>
                    {group.unread > 0 && (
                      <div className="unread-badge">{group.unread}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Contacts Section */}
            {filteredContacts.length === 0 && filteredGroups.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>
                  {isXMTPReady ? '💬' : '⏳'}
                </div>
                <p style={{ marginBottom: 8 }}>
                  {isXMTPReady
                    ? 'No conversations yet'
                    : 'Connect your wallet to start messaging'}
                </p>
                {isXMTPReady && (
                  <button
                    onClick={() => setShowNewChat(true)}
                    style={{ padding: '8px 20px', borderRadius: 8, background: '#00a884', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Start New Chat
                  </button>
                )}
              </div>
            )}

            {/* Contacts Section */}
            {filteredContacts.length > 0 && (
              <div className="contacts-section">
                {filteredGroups.length > 0 && (
                  <div className="section-header">
                    <span>👤 Contacts</span>
                  </div>
                )}
                {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedContact(contact);
                  setContacts(contacts.map(c => 
                    c.id === contact.id ? { ...c, unread: 0 } : c
                  ));
                }}
              >
                <div 
                  className={`contact-avatar ${contact.hasStatus ? 'has-status' : ''} ${hasUnviewedStatus(contact.id) ? 'unviewed-status' : ''}`}
                  onClick={(e) => {
                    if (contact.hasStatus) {
                      e.stopPropagation();
                      viewStatus(contact.id);
                    }
                  }}
                >
                  {contact.avatar}
                  {contact.online && <span className="online-indicator"></span>}
                </div>
                <div className="contact-info">
                  <div className="contact-header">
                    <h3>
                      {contact.pinned && '📌 '}
                      {contact.name}
                    </h3>
                    <span className="contact-time">{contact.time}</span>
                  </div>
                  <p className="contact-last-message">{contact.lastMessage}</p>
                </div>
                {contact.unread > 0 && (
                  <div className="unread-badge">{contact.unread}</div>
                )}
              </div>
            ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {selectedContact ? (
            <>
              <div className="chat-header">
                <div className={`contact-avatar-large ${selectedContact.isGroup ? 'group-avatar' : ''}`}>
                  {selectedContact.isGroup ? selectedContact.icon : selectedContact.avatar}
                  {!selectedContact.isGroup && selectedContact.online && <span className="online-indicator"></span>}
                </div>
                <div className="contact-details">
                  <h3>{selectedContact.name}</h3>
                  {selectedContact.isGroup ? (
                    <p className="contact-status">
                      {getMemberNames(selectedContact)}
                    </p>
                  ) : (
                    <p className="contact-status">
                      {selectedContact.online ? 
                        '🟢 Online' : 
                        `Last seen ${selectedContact.lastSeen}`
                      }
                    </p>
                  )}
                </div>
                <div className="chat-actions">
                  <button 
                    className="icon-btn" 
                    onClick={() => startCall('voice')}
                    title="Voice Call"
                  >
                    📞
                  </button>
                  <button 
                    className="icon-btn" 
                    onClick={() => startCall('video')}
                    title="Video Call"
                  >
                    📹
                  </button>
                  <button className="icon-btn" onClick={() => setShowSearch(!showSearch)}>🔍</button>
                  <button className="icon-btn" onClick={() => handleArchiveContact(selectedContact.id)}>
                    📁
                  </button>
                  <button className="icon-btn">⋮</button>
                </div>
              </div>

              <div className="messages-area">
                {filteredMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message-bubble ${msg.sender}`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({ messageId: msg.id, x: e.clientX, y: e.clientY });
                    }}
                  >
                    {msg.replyTo && (
                      <div className="reply-indicator">
                        <span>↩️ Replying to: {msg.replyTo.content}</span>
                      </div>
                    )}
                    
                    {msg.type === 'text' && (
                      <div className="message-content">
                        {msg.starred && <span className="star-icon">⭐</span>}
                        {msg.content}
                        {msg.edited && <span className="edited-indicator">edited</span>}
                      </div>
                    )}
                    
                    {msg.type === 'image' && (
                      <div className="message-media">
                        {msg.starred && <span className="star-icon">⭐</span>}
                        {msg.fileData?.url ? (
                          <img src={msg.fileData.url} alt={msg.fileData.name || 'image'} style={{ maxWidth: 240, borderRadius: 8 }} />
                        ) : (
                          <div className="image-placeholder">
                            <span style={{ fontSize: '4rem' }}>🖼️</span>
                            <p>{msg.content}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {msg.type === 'voice' && (
                      <div className="message-voice">
                        {msg.starred && <span className="star-icon">⭐</span>}
                        <span className="voice-icon">🎤</span>
                        {msg.fileData?.url ? (
                          <audio controls src={msg.fileData.url} style={{ height: 32, maxWidth: 200 }} />
                        ) : (
                          <div className="voice-waveform">▁▃▅▇▅▃▁</div>
                        )}
                        <span className="voice-duration">
                          {msg.fileData?.duration ? `${msg.fileData.duration}s` : ''}
                        </span>
                        {msg.status === 'sending' && <span style={{ fontSize: 11, color: '#aaa' }}> sending...</span>}
                        {msg.status === 'failed' && <span style={{ fontSize: 11, color: '#f55' }}> ❌ failed</span>}
                      </div>
                    )}
                    
                    {msg.type === 'file' && (
                      <div className="message-file">
                        {msg.starred && <span className="star-icon">⭐</span>}
                        <span className="file-icon">📄</span>
                        {msg.fileData?.url ? (
                          <a href={msg.fileData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7eb8f7', textDecoration: 'underline' }}>
                            {msg.fileData.name || msg.content}
                          </a>
                        ) : (
                          <span>{msg.content}</span>
                        )}
                        {msg.status === 'sending' && <span style={{ fontSize: 11, color: '#aaa' }}> uploading...</span>}
                        {msg.status === 'failed' && <span style={{ fontSize: 11, color: '#f55' }}> ❌ failed</span>}
                      </div>
                    )}
                    
                    <div className="message-footer">
                      <span className="message-time">{msg.time}</span>
                      {msg.sender === 'me' && (
                        <span className={`message-status ${msg.status}`}>
                          {getMessageStatus(msg.status)}
                        </span>
                      )}
                    </div>
                    
                    {msg.reactions.length > 0 && (
                      <div className="message-reactions">
                        {msg.reactions.map((reaction, idx) => (
                          <span key={idx} className="reaction">
                            {reaction.emoji} {reaction.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoadingMessages && (
                  <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                    <p>Loading messages from XMTP...</p>
                  </div>
                )}

                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {editingMessage && (
                <div className="edit-preview">
                  <div className="edit-content">
                    <span>✏️ Editing message</span>
                    <p>{editingMessage.content}</p>
                  </div>
                  <button onClick={handleCancelEdit}>✕</button>
                </div>
              )}

              {replyingTo && !editingMessage && (
                <div className="reply-preview">
                  <div className="reply-content">
                    <span>Replying to:</span>
                    <p>{replyingTo.content}</p>
                  </div>
                  <button onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}

              {selectedFile && (
                <div className="file-preview">
                  <span>📎 {selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)}>✕</button>
                </div>
              )}

              <div className="message-input">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <button 
                  className="icon-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  😊
                </button>
                <button 
                  className="icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📎
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    // XMTP doesn't have built-in typing indicators
                    // Typing indicators could be implemented as separate messages if needed
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                />
                {message || selectedFile ? (
                  <button className="btn btn-primary" onClick={handleSend}>
                    Send
                  </button>
                ) : recording ? (
                  <button
                    className="voice-btn recording"
                    onClick={handleVoiceRecord}
                    title="Tap to stop and send"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', background: 'rgba(255,60,60,0.2)', border: '1px solid #f55', borderRadius: 20 }}
                  >
                    <span style={{ color: '#f55', animation: 'pulse 1s infinite' }}>⏺</span>
                    <span style={{ color: '#f55', fontSize: 13, minWidth: 30 }}>{recordingDuration}s</span>
                  </button>
                ) : (
                  <button 
                    className="voice-btn"
                    onClick={handleVoiceRecord}
                    title="Hold to record voice message"
                  >
                    🎤
                  </button>
                )}
              </div>

              {showEmojiPicker && (
                <div className="emoji-picker">
                  {['😊', '❤️', '👍', '😂', '😮', '😢', '🎉', '🔥', '💯', '👏'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setMessage(message + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <h3>💬 XMTP Decentralized Messaging</h3>
              {isXMTPReady ? (
                <>
                  <p>🔒 End-to-end encrypted · Wallet-to-wallet · Censorship resistant</p>
                  <p style={{ marginTop: 8, color: '#00a884' }}>✅ XMTP Connected</p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#00a884', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}
                  >
                    + New Encrypted Chat
                  </button>
                </>
              ) : (
                <>
                  <p>Connect your wallet to enable end-to-end encrypted messaging</p>
                  <p style={{ marginTop: 8, color: '#aaa' }}>⏳ Waiting for XMTP...</p>
                </>
              )}
              <p className="encryption-note" style={{ marginTop: 16 }}>🔒 All messages are end-to-end encrypted via XMTP</p>
            </div>
          )}
        </div>

        {/* Call Interface */}
        {callState && callState !== 'idle' && (
          <div className="call-overlay">
            <div className="call-interface">
              {callState === 'calling' && (
                <div className="call-status">
                  <div className="call-avatar">{selectedContact?.avatar}</div>
                  <h2>{selectedContact?.name}</h2>
                  <p className="call-status-text">Calling...</p>
                  <div className="calling-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <button className="end-call-btn" onClick={endCall}>
                    📞
                  </button>
                </div>
              )}

              {callState === 'active' && (
                <>
                  {callType === 'video' ? (
                    <div className="video-call-container">
                      <div 
                        ref={remoteVideoRef} 
                        className="remote-video"
                      >
                        <div className="video-placeholder">
                          <span className="video-avatar">{selectedContact?.avatar}</span>
                        </div>
                      </div>
                      <div 
                        ref={localVideoRef} 
                        className="local-video"
                        style={{ display: isVideoEnabled ? 'block' : 'none' }}
                      >
                        <div className="video-placeholder-small">
                          <span>You</span>
                        </div>
                      </div>
                      {!isVideoEnabled && (
                        <div className="local-video video-disabled">
                          <span>📷</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="voice-call-container">
                      <div className="call-avatar-large">{selectedContact?.avatar}</div>
                      <h2>{selectedContact?.name}</h2>
                    </div>
                  )}

                  <div className="call-info">
                    <p className="call-duration">{formatCallDuration(callDuration)}</p>
                  </div>

                  <div className="call-controls">
                    <button 
                      className={`control-btn ${isMuted ? 'active' : ''}`}
                      onClick={toggleMute}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? '🔇' : '🎤'}
                    </button>
                    
                    {callType === 'video' && (
                      <button 
                        className={`control-btn ${!isVideoEnabled ? 'active' : ''}`}
                        onClick={toggleVideo}
                        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                      >
                        {isVideoEnabled ? '📹' : '📷'}
                      </button>
                    )}
                    
                    <button className="control-btn end-btn" onClick={endCall}>
                      📞
                    </button>
                    
                    <button className="control-btn" title="More options">
                      ⋮
                    </button>
                  </div>
                </>
              )}

              {callState === 'ended' && (
                <div className="call-status">
                  <div className="call-avatar">{selectedContact?.avatar}</div>
                  <h2>Call Ended</h2>
                  <p className="call-status-text">Duration: {formatCallDuration(callDuration)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Incoming Call */}
        {incomingCall && (
          <div className="call-overlay">
            <div className="incoming-call">
              <div className="call-avatar-large">{incomingCall.contact.avatar}</div>
              <h2>{incomingCall.contact.name}</h2>
              <p className="call-type-text">
                {incomingCall.callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
              </p>
              <div className="incoming-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="incoming-call-actions">
                <button className="reject-btn" onClick={rejectCall}>
                  ❌
                </button>
                <button className="answer-btn" onClick={answerCall}>
                  📞
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div 
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={() => setContextMenu(null)}
          >
            <button onClick={() => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              setReplyingTo(msg);
              setContextMenu(null);
            }}>
              ↩️ Reply
            </button>
            {(() => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              return msg?.sender === 'me' && msg?.type === 'text' && (
                <button onClick={() => handleEditMessage(contextMenu.messageId)}>
                  ✏️ Edit
                </button>
              );
            })()}
            <button onClick={() => handleReact(contextMenu.messageId, '❤️')}>
              ❤️ React
            </button>
            <button onClick={() => handleStarMessage(contextMenu.messageId)}>
              ⭐ Star
            </button>
            <button onClick={() => alert('Forward feature (demo)')}>
              ➡️ Forward
            </button>
            {(() => {
              const msg = messages.find(m => m.id === contextMenu.messageId);
              return msg?.sender === 'me' && (
                <button onClick={() => handleDeleteMessage(contextMenu.messageId)} className="delete">
                  🗑️ Delete
                </button>
              );
            })()}
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Profile</h2>
                <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="profile-pic-section">
                  <div className="profile-pic-large">
                    {typeof userProfile.avatar === 'string' && userProfile.avatar.startsWith('data:') ? (
                      <img src={userProfile.avatar} alt="Profile" />
                    ) : (
                      <span>{userProfile.avatar}</span>
                    )}
                  </div>
                  <div className="profile-pic-actions">
                    <input
                      type="file"
                      ref={profilePicInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleProfilePicChange}
                    />
                    <button 
                      className="btn btn-secondary"
                      onClick={() => profilePicInputRef.current?.click()}
                    >
                      📷 Upload Photo
                    </button>
                    <div className="emoji-avatar-picker">
                      <p>Or choose an emoji:</p>
                      <div className="emoji-options">
                        {['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '🦸', '🦸‍♀️'].map((emoji) => (
                          <button
                            key={emoji}
                            className="emoji-option"
                            onClick={() => handleProfilePicEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profile-info-section">
                  <div className="profile-field">
                    <label>Name</label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="profile-field">
                    <label>About</label>
                    <input
                      type="text"
                      value={userProfile.about}
                      onChange={(e) => setUserProfile({ ...userProfile, about: e.target.value })}
                      placeholder="Your status"
                    />
                  </div>
                  <div className="profile-field">
                    <label>Wallet Address</label>
                    <input
                      type="text"
                      value={wallet?.address || 'Not connected'}
                      disabled
                    />
                  </div>
                </div>
                <div className="profile-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveProfile}>💾 Save Profile</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {showStatusModal && (
          <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
            <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Post Status</h2>
                <button className="modal-close" onClick={() => setShowStatusModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <textarea
                  className="status-input"
                  placeholder="What's on your mind?"
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  maxLength={200}
                />
                <div className="status-actions">
                  <span className="char-count">{statusText.length}/200</span>
                  <button 
                    className="btn btn-primary"
                    onClick={handlePostStatus}
                    disabled={!statusText.trim()}
                  >
                    Post Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Viewer */}
        {showStatusViewer && (
          <div className="status-viewer-overlay" onClick={() => setShowStatusViewer(null)}>
            <div className="status-viewer" onClick={(e) => e.stopPropagation()}>
              <button className="status-close" onClick={() => setShowStatusViewer(null)}>✕</button>
              <div className="status-progress">
                {showStatusViewer.statuses.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`progress-bar ${idx <= showStatusViewer.currentIndex ? 'active' : ''}`}
                  />
                ))}
              </div>
              <div 
                className="status-content"
                style={{ 
                  background: showStatusViewer.statuses[showStatusViewer.currentIndex].backgroundColor 
                }}
              >
                <div className="status-header">
                  <div className="status-user-info">
                    {showStatusViewer.contactId === wallet?.address?.toLowerCase() ? (
                      <>
                        <div className="status-user-avatar">
                          {typeof userProfile.avatar === 'string' && userProfile.avatar.startsWith('data:') ? (
                            <img src={userProfile.avatar} alt="Your status" />
                          ) : (
                            <span>{userProfile.avatar}</span>
                          )}
                        </div>
                        <span>{userProfile.name}</span>
                      </>
                    ) : (
                      <>
                        <div className="status-user-avatar">
                          {contacts.find(c => c.id === showStatusViewer.contactId)?.avatar}
                        </div>
                        <span>{contacts.find(c => c.id === showStatusViewer.contactId)?.name}</span>
                      </>
                    )}
                    <span className="status-time">
                      {new Date(showStatusViewer.statuses[showStatusViewer.currentIndex].timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <p className="status-text">
                  {showStatusViewer.statuses[showStatusViewer.currentIndex].content}
                </p>
              </div>
              <button className="status-nav prev" onClick={prevStatus}>❮</button>
              <button className="status-nav next" onClick={nextStatus}>❯</button>
            </div>
          </div>
        )}

        {/* Group Creation Modal */}
        {showGroupModal && (
          <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
            <div className="modal-content group-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Group</h2>
                <button className="modal-close" onClick={() => setShowGroupModal(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="group-setup-section">
                  <div className="group-icon-section">
                    <div className="group-icon-preview">
                      {groupIcon}
                    </div>
                    <div className="group-icon-picker">
                      <p>Choose group icon:</p>
                      <div className="icon-options">
                        {['👥', '🚀', '💼', '🎓', '⚽', '🎮', '🎵', '📚', '💻', '🍕', '✨', '🔥'].map((icon) => (
                          <button
                            key={icon}
                            className={`icon-option ${groupIcon === icon ? 'selected' : ''}`}
                            onClick={() => setGroupIcon(icon)}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="group-name-section">
                    <label>Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                      maxLength={50}
                    />
                  </div>
                </div>
                <div className="group-members-section">
                  <h3>Select Members ({selectedMembers.length} selected)</h3>
                  <p className="helper-text">At least 2 members required</p>
                  <div className="members-list">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`member-item ${selectedMembers.includes(contact.id) ? 'selected' : ''}`}
                        onClick={() => toggleMemberSelection(contact.id)}
                      >
                        <div className="member-checkbox">
                          {selectedMembers.includes(contact.id) && '✓'}
                        </div>
                        <div className="member-avatar">
                          {contact.avatar}
                        </div>
                        <div className="member-info">
                          <h4>{contact.name}</h4>
                          <p>{contact.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="group-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowGroupModal(false);
                      setGroupName('');
                      setGroupIcon('👥');
                      setSelectedMembers([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim() || selectedMembers.length < 2}
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
