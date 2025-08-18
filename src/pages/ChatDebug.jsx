import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useChat } from '../context/ChatContext';

const ChatDebug = () => {
  const { user, token } = useContext(AppContext);
  const { chats, currentChat, isConnected } = useChat();
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const testChatAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/chat/test/check-chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setTestResults(data);
      console.log('Chat test results:', data);
    } catch (error) {
      console.error('Error testing chat access:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testSocketAuth = async (chatId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chat/test/socket-auth/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setTestResults(data);
      console.log('Socket auth test results:', data);
    } catch (error) {
      console.error('Error testing socket auth:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Chat Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            <p><strong>ID:</strong> {user?._id}</p>
            <p><strong>Socket Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Chat Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Chat Information</h2>
          <div className="space-y-2">
            <p><strong>Total Chats:</strong> {chats?.length || 0}</p>
            <p><strong>Current Chat:</strong> {currentChat?._id || 'None'}</p>
            {currentChat && (
              <div className="mt-2 p-2 bg-gray-100 rounded">
                <p><strong>Patient:</strong> {currentChat.patient?.name} ({currentChat.patient?._id})</p>
                <p><strong>Doctor:</strong> {currentChat.doctor?.name} ({currentChat.doctor?._id})</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Debug Tests</h2>
        <div className="space-x-4">
          <button
            onClick={testChatAccess}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Chat Access'}
          </button>
          
          {currentChat && (
            <button
              onClick={() => testSocketAuth(currentChat._id)}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Socket Auth'}
            </button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {/* Chat List */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">All Chats</h2>
        {chats?.length > 0 ? (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div key={chat._id} className="p-3 border rounded">
                <p><strong>Chat ID:</strong> {chat._id}</p>
                <p><strong>Patient:</strong> {chat.patient?.name} ({chat.patient?._id})</p>
                <p><strong>Doctor:</strong> {chat.doctor?.name} ({chat.doctor?._id})</p>
                <p><strong>Messages:</strong> {chat.messages?.length || 0}</p>
                <button
                  onClick={() => testSocketAuth(chat._id)}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                >
                  Test Auth for this Chat
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No chats found</p>
        )}
      </div>
    </div>
  );
};

export default ChatDebug;
