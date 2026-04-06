import React, { useState, useRef, useEffect } from 'react';
import { Send, LogOut, Plane, User, Loader2 } from 'lucide-react';
import FlightTicket from './FlightTicket';
import BookingConfirmation from './BookingConfirmation';
import BookingReview from './BookingReview';
import PaymentModal from './PaymentModal';
import MessageRenderer from './MessageRenderer';

const Chat = ({ user, setIsAuthenticated }) => {
    const [messages, setMessages] = useState([
        { role: 'model', parts: ['Hello! I am IndiBot. To start, please tell me: \n1. Origin & Destination\n2. Travel Date\n3. Class (Economy/Business)'] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentModalData, setPaymentModalData] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const sendMessage = async (e, customMessage = null) => {
        if (e) e.preventDefault();
        const messageToSend = customMessage || input;

        if (!messageToSend.trim()) return;

        if (!customMessage) setInput('');
        setMessages(prev => [...prev, { role: 'user', parts: [messageToSend] }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageToSend }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages(prev => [...prev, { role: 'model', parts: [data.response] }]);
            } else {
                setMessages(prev => [...prev, { role: 'error', parts: ['Sorry, something went wrong.'] }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'error', parts: ['Network error. Please try again.'] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFlightSelect = (flight) => {
        sendMessage(null, `I want to book flight ${flight.flight_no} (${flight.class || 'Economy'}) for ${flight.price}`);
    };

    const handlePaymentComplete = (method) => {
        setPaymentModalData(null);
        sendMessage(null, `Payment Successful via ${method.toUpperCase()}`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center space-x-2">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Plane className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">IndiBot</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                        <User size={18} />
                        <span className="font-medium hidden sm:inline">{user}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : msg.role === 'error'
                                    ? 'bg-red-100 text-red-700 rounded-bl-none'
                                    : 'bg-white text-gray-800 rounded-bl-none'
                                }`}
                        >
                            <MessageRenderer
                                text={msg.parts[0]}
                                isUser={msg.role === 'user'}
                                onFlightSelect={handleFlightSelect}
                                onReviewConfirm={() => sendMessage(null, "Details confirmed. Proceed to payment.")}
                                onPaymentRequest={(data) => setPaymentModalData({ amount: data.amount })}
                            />
                            <div className={`text-xs mt-1 text-right ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center space-x-3 text-gray-500">
                            <Loader2 className="animate-spin" size={18} />
                            <span className="text-sm">IndiBot is typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative flex items-end">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                sendMessage(e);
                            }
                        }}
                        placeholder="Type your message... (Enter for new line, Ctrl+Enter to send)"
                        className="w-full bg-gray-100 text-gray-800 rounded-2xl py-3 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent transition-all resize-none min-h-[50px] max-h-[150px]"
                        rows={1}
                        style={{ height: 'auto', minHeight: '52px' }}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </footer>

            {/* Payment Modal */}
            {paymentModalData && (
                <PaymentModal
                    amount={paymentModalData.amount}
                    onClose={() => setPaymentModalData(null)}
                    onComplete={handlePaymentComplete}
                />
            )}
        </div>
    );
};

export default Chat;
