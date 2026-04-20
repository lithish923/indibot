import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Chat from './components/Chat';
import Bookings from './components/Bookings';
import History from './components/History';
import Sidebar from './components/Sidebar';
import { apiFetch } from './api';

// Layout component to wrap authenticated routes
const Layout = ({ children, onLogout, onNewChat }) => {
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar onLogout={onLogout} onNewChat={onNewChat} />
            <div className="flex-1 overflow-hidden">
                {children}
            </div>
        </div>
    );
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [chatId, setChatId] = useState(0); // Used to reset Chat component

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await apiFetch('/api/check-auth');
            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(true);
                setUser(data.username);
            } else {
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Auth check failed', error);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await apiFetch('/api/logout', { method: 'POST' });
            setIsAuthenticated(false);
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const handleNewChat = async () => {
        try {
            await apiFetch('/api/chat/new', { method: 'POST' });
            setChatId(prev => prev + 1); // Remount Chat component
        } catch (error) {
            console.error("Failed to start new chat", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-indigo-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route
                    path="/login"
                    element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} /> : <Navigate to="/" />}
                />
                <Route
                    path="/register"
                    element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
                />

                {/* Protected Routes */}
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route
                    path="/chat"
                    element={
                        isAuthenticated ? (
                            <Layout onLogout={handleLogout} onNewChat={handleNewChat}>
                                <Chat key="new" user={user} setIsAuthenticated={setIsAuthenticated} />
                            </Layout>
                        ) : <Navigate to="/login" />
                    }
                />
                <Route
                    path="/chat/:chatId"
                    element={
                        isAuthenticated ? (
                            <Layout onLogout={handleLogout} onNewChat={handleNewChat}>
                                <Chat user={user} setIsAuthenticated={setIsAuthenticated} />
                            </Layout>
                        ) : <Navigate to="/login" />
                    }
                />
                <Route
                    path="/bookings"
                    element={
                        isAuthenticated ? (
                            <Layout onLogout={handleLogout} onNewChat={handleNewChat}>
                                <Bookings />
                            </Layout>
                        ) : <Navigate to="/login" />
                    }
                />
                <Route
                    path="/history"
                    element={
                        isAuthenticated ? (
                            <Layout onLogout={handleLogout} onNewChat={handleNewChat}>
                                <History />
                            </Layout>
                        ) : <Navigate to="/login" />
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
