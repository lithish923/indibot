import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageRenderer from './MessageRenderer';

const History = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedChatId) {
            fetchMessages(selectedChatId);
        }
    }, [selectedChatId]);

    const fetchConversations = async () => {
        try {
            const response = await apiFetch('/api/history');
            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations);
                if (data.conversations.length > 0) {
                    // Optional: Select first chat by default
                    // setSelectedChatId(data.conversations[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId) => {
        setLoadingMessages(true);
        try {
            const response = await fetch(`/api/history/${chatId}`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading history...</div>;

    return (
        <div className="flex h-full bg-white">
            {/* Sidebar - List of Chats */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-700">Past Conversations</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No conversations yet.</div>
                    ) : (
                        conversations.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedChatId(chat.id)}
                                className={`w-full text-left p-4 hover:bg-white transition-colors focus:outline-none ${selectedChatId === chat.id ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <MessageSquare size={18} className="text-gray-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-medium text-gray-800 text-sm line-clamp-1">{chat.title || 'New Chat'}</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(chat.created_at + 'Z').toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content - Chat Messages */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100">
                {selectedChatId ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loadingMessages ? (
                            <div className="text-center text-gray-500 mt-10">Loading messages...</div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 rounded-bl-none'
                                            }`}
                                    >
                                        <MessageRenderer text={msg.message} isHistory={true} isUser={msg.role === 'user'} />
                                        <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {new Date(msg.timestamp + 'Z').toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {messages.length === 0 && !loadingMessages && (
                            <div className="text-center text-gray-500">No messages in this conversation.</div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Select a conversation to view history</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
