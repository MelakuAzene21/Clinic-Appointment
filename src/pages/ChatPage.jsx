import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import Chat from '../components/Chat';

const ChatPage = () => {
  const { user } = useContext(AppContext);

  // Only allow doctors and patients to access chat
  if (user?.role !== 'doctor' && user?.role !== 'patient') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only doctors and patients can access the chat feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">
          {user.role === 'doctor' 
            ? 'Chat with your patients about their appointments and health concerns.'
            : 'Chat with your doctors about your appointments and health questions.'
          }
        </p>
      </div>
      
      <Chat />
    </div>
  );
};

export default ChatPage;
