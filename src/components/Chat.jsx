import React, { useState, useEffect, useContext, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { AppContext } from '../context/AppContext';
import assets from '../assets/assets';

const Chat = () => {
  const { user } = useContext(AppContext);
  const { 
    chats, 
    currentChat, 
    joinChat, 
    leaveChat, 
    sendMessage, 
    fetchChats,
    unreadCounts,
    isConnected 
  } = useChat();
  
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    console.log('Current chat updated:', currentChat);
  }, [currentChat]);

  useEffect(() => {
    console.log('Chats updated:', chats);
  }, [chats]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChatSelect = (chat) => {
    console.log('Selecting chat:', chat);
    if (currentChat) {
      leaveChat(currentChat._id);
    }
    joinChat(chat._id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentChat) {
      sendMessage(currentChat._id, message);
      setMessage('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getOtherUser = (chat) => {
    if (user.role === 'doctor') {
      return chat.patient;
    } else {
      return chat.doctor;
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat List */}
      <div className="w-1/3 border-r border-gray-200 bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
          <p className="text-sm text-gray-600">
            {chats.length} conversation{chats.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="overflow-y-auto h-[calc(600px-80px)]">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <img src={assets.chats_icon} alt="No chats" className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Book an appointment to start chatting</p>
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const unreadCount = unreadCounts[chat._id] || 0;
              const lastMessage = chat.messages[chat.messages.length - 1];
              
              return (
                                 <div
                   key={chat._id}
                   onClick={() => handleChatSelect(chat)}
                   className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${
                     currentChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : ''
                   }`}
                 >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={otherUser.image || assets.profile_pic}
                        alt={otherUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{otherUser.name}</h3>
                        <p className="text-sm text-gray-600">
                          {user.role === 'doctor' ? 'Patient' : otherUser.speciality}
                        </p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 truncate">
                        {lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(lastMessage.timestamp)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

             {/* Chat Messages */}
       <div className="flex-1 flex flex-col">
         {currentChat ? (
          <>
                         {/* Chat Header */}
             <div className="p-4 border-b border-gray-200 bg-white">
               <div className="flex items-center space-x-3">
                 <img
                   src={getOtherUser(currentChat).image || assets.profile_pic}
                   alt={getOtherUser(currentChat).name}
                   className="w-10 h-10 rounded-full object-cover"
                 />
                 <div>
                   <h3 className="font-medium text-gray-900">
                     {getOtherUser(currentChat).name}
                   </h3>
                   <p className="text-sm text-gray-600">
                     {user.role === 'doctor' ? 'Patient' : getOtherUser(currentChat).speciality}
                   </p>
                 </div>
                <div className="ml-auto">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            </div>

                         {/* Messages */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {currentChat.messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <img src={assets.chats_icon} alt="Start chat" className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
                             ) : (
                 currentChat.messages.map((msg, index) => {
                   // Handle both populated and unpopulated sender objects
                   const senderId = msg.sender?._id || msg.sender;
                   const isOwnMessage = senderId === user._id;
                   const showDate = index === 0 || 
                     formatDate(msg.timestamp) !== formatDate(currentChat.messages[index - 1].timestamp);

                  return (
                    <div key={index}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 my-2">
                          {formatDate(msg.timestamp)}
                        </div>
                      )}
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isConnected}
                />
                <button
                  type="submit"
                  disabled={!message.trim() || !isConnected}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <img src={assets.chats_icon} alt="Select chat" className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
