import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AppContext } from './AppContext';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export { ChatContext };

export const useChat = () => {
  const context = useContext(ChatContext);
  console.log('useChat hook called, context:', context);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { token, user } = useContext(AppContext);
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token && user) {
      console.log('Initializing Socket.IO connection for user:', user.name, user.role);
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      newSocket.on('new_message', (data) => {
        const { chatId, message, senderName } = data;
        console.log('Received new message:', data);
        console.log('Current user ID:', user._id);
        console.log('Message sender:', message.sender);
        console.log('Message sender ID:', message.sender?._id);
        
        // Check if this message is from the current user
        const isOwnMessage = message.sender === user._id || message.sender?._id === user._id;
        console.log('Is own message:', isOwnMessage);
        
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === chatId) {
              // If it's our own message, replace any temporary messages with the real one
              if (isOwnMessage) {
                const filteredMessages = chat.messages.filter(msg => !msg.isTemp);
                return {
                  ...chat,
                  messages: [...filteredMessages, message],
                  lastMessage: new Date()
                };
              } else {
              return {
                ...chat,
                messages: [...chat.messages, message],
                lastMessage: new Date()
              };
              }
            }
            return chat;
          });
        });

        // Update current chat if it's the active one
        setCurrentChat(prevChat => {
          if (prevChat?._id === chatId) {
            // If it's our own message, replace any temporary messages with the real one
            if (isOwnMessage) {
              const filteredMessages = prevChat.messages.filter(msg => !msg.isTemp);
              return {
                ...prevChat,
                messages: [...filteredMessages, message],
                lastMessage: new Date()
              };
            } else {
            return {
              ...prevChat,
              messages: [...prevChat.messages, message],
              lastMessage: new Date()
            };
            }
          }
          return prevChat;
        });

        // If message is from other user
        if (!isOwnMessage) {
          if (currentChat?._id === chatId) {
            // If chat is open, immediately mark as read on server to persist across refresh/login
            markMessagesAsRead(chatId);
          } else {
            // Otherwise increase unread count and show a notification
            setUnreadCounts(prev => ({
              ...prev,
              [chatId]: (prev[chatId] || 0) + 1
            }));

            toast.info(`New message from ${senderName}`, {
              position: "top-right",
              autoClose: 3000
            });
          }
        }
      });

      newSocket.on('message_notification', (data) => {
        const { chatId, senderName, content, unreadCount } = data;
        console.log('Received message notification:', data);
        console.log('Current user name:', user.name);
        console.log('Sender name:', senderName);
        
        // Check if this notification is from the current user
        const isOwnNotification = senderName === user.name;
        console.log('Is own notification:', isOwnNotification);
        
        // Only update unread count and show notification if it's NOT from the current user
        if (!isOwnNotification) {
          if (currentChat?._id === chatId) {
            // If chat is open, mark as read immediately
            markMessagesAsRead(chatId);
          } else {
            setUnreadCounts(prev => ({
              ...prev,
              [chatId]: unreadCount
            }));

            // Show notification only for messages from other users
            toast.info(`${senderName}: ${content}`, {
              position: "top-right",
              autoClose: 5000
            });
          }
        }
      });

      newSocket.on('user_typing', (data) => {
        const { chatId, userName, isTyping } = data;
        // Handle typing indicator
        if (currentChat?._id === chatId) {
          // You can implement typing indicator UI here
          console.log(`${userName} is ${isTyping ? 'typing' : 'not typing'}`);
        }
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        if (error.message === 'Not authorized for this chat') {
          toast.error('You are not authorized to send messages in this chat. Please check your permissions.');
        } else {
        toast.error(error.message || 'Chat connection error');
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token, user]);

  // Fetch user's chats
  const fetchChats = async () => {
    try {
      console.log('Fetching chats for user:', user?.name);
      const response = await fetch('http://localhost:5000/api/chat', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched chats:', data.data);
        
        // Validate chat data and add fallbacks for missing user data
        const validatedChats = data.data.map(chat => ({
          ...chat,
          patient: chat.patient || { name: 'Unknown Patient', image: null },
          doctor: chat.doctor || { name: 'Unknown Doctor', image: null, speciality: 'Unknown' },
          messages: chat.messages || []
        }));
        
        console.log('Validated chats:', validatedChats);
        setChats(validatedChats);
        
        // Calculate unread counts (only messages from the other participant)
        const counts = {};
        const otherSenderModel = user?.role === 'doctor' ? 'User' : 'Doctor';
        data.data.forEach(chat => {
          counts[chat._id] = (chat.messages || []).filter(msg => !msg.isRead && msg.senderModel === otherSenderModel).length;
        });
        setUnreadCounts(counts);
      } else {
        console.error('Failed to fetch chats:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Join a chat room
  const joinChat = (chatId) => {
    if (socket && chatId) {
      console.log(`Joining chat room: ${chatId}`);
      socket.emit('join_chat', chatId);
      
      const selectedChat = chats.find(chat => chat._id === chatId);
      setCurrentChat(selectedChat);
      
      // Optimistically clear unread badge immediately
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));

      // Mark messages as read on server to persist across refresh/login
      markMessagesAsRead(chatId);
    }
  };

  // Leave a chat room
  const leaveChat = (chatId) => {
    if (socket && chatId) {
      socket.emit('leave_chat', chatId);
      setCurrentChat(null);
    }
  };

  // Send a message
  const sendMessage = (chatId, content) => {
    if (socket && chatId && content.trim()) {
      console.log(`Sending message to chat ${chatId}: ${content}`);
      console.log('Current user:', user);
      console.log('Socket connected:', socket.connected);
      
      // Create a temporary message for immediate UI update
      const tempMessage = {
        _id: `temp_${Date.now()}`, // Temporary ID with prefix
        sender: user._id,
        senderModel: user.role === 'doctor' ? 'Doctor' : 'User',
        content: content.trim(),
        timestamp: new Date(),
        isRead: false,
        isTemp: true // Flag to identify temporary messages
      };

      // Add message to current chat immediately for better UX
      setCurrentChat(prevChat => {
        if (prevChat?._id === chatId) {
          return {
            ...prevChat,
            messages: [...prevChat.messages, tempMessage],
            lastMessage: new Date()
          };
        }
        return prevChat;
      });

      // Add message to chats list
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat._id === chatId) {
            return {
              ...chat,
              messages: [...chat.messages, tempMessage],
              lastMessage: new Date()
            };
          }
          return chat;
        });
      });

      socket.emit('send_message', {
        chatId,
        content: content.trim()
      });
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (chatId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setUnreadCounts(prev => ({
          ...prev,
          [chatId]: 0
        }));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Create a new chat
  const createChat = async (patientId) => {
    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patientId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setChats(prev => [data.data, ...prev]);
          return { success: true, data: data.data };
        } else {
          return { success: false, message: data.message };
        }
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Failed to create chat' };
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      return { success: false, message: 'Failed to create chat' };
    }
  };

  // Get total unread count
  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  };

  // Fetch chats when user changes
  useEffect(() => {
    if (token && user && isConnected) {
      fetchChats();
    }
  }, [token, user, isConnected]);

  const value = {
    socket,
    chats,
    currentChat,
    setCurrentChat,
    unreadCounts,
    isConnected,
    fetchChats,
    joinChat,
    leaveChat,
    sendMessage,
    markMessagesAsRead,
    createChat,
    getTotalUnreadCount
  };
  
  console.log('ChatContext value:', value);
  console.log('setCurrentChat in context:', setCurrentChat);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
