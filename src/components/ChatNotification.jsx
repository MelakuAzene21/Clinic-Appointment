import React, { useContext } from 'react';
import { useChat } from '../context/ChatContext';
import { AppContext } from '../context/AppContext';
import assets from '../assets/assets';

const ChatNotification = () => {
  const { user } = useContext(AppContext);
  const { getTotalUnreadCount, isConnected } = useChat();
  
  const unreadCount = getTotalUnreadCount();

  // Only show for doctors and patients
  if (user?.role !== 'doctor' && user?.role !== 'patient') {
    return null;
  }

  return (
    <div className="relative">
      <img 
        src={assets.chats_icon} 
        alt="Messages" 
        className="w-6 h-6 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
      />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {!isConnected && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-400 rounded-full"></div>
      )}
    </div>
  );
};

export default ChatNotification;
