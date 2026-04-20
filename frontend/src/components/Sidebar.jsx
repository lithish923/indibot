import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquarePlus, History, Ticket, LogOut } from 'lucide-react';

const Sidebar = ({ onNewChat, onLogout }) => {
    const navigate = useNavigate();

    const handleNewChatClick = async () => {
        if (onNewChat) {
            await onNewChat();
        }
        navigate('/chat');
    };

    const navItems = [
        { icon: MessageSquarePlus, label: 'New Chat', action: handleNewChatClick },
        { icon: History, label: 'Chat History', path: '/history' },
        { icon: Ticket, label: 'My Bookings', path: '/bookings' },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                    <span>IndiBot</span>
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item, index) => (
                    item.path ? (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ) : (
                        <button
                            key={index}
                            onClick={item.action}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-left"
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    )
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
