import React, { useEffect, useState } from 'react';
import { Ticket, Calendar, MapPin, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

const BookingModal = ({ booking, onClose, onModify }) => {
    if (!booking) return null;
    const details = booking.details || {};
    const contact = details.contact || {};
    const extras = details.extras || {};
    const payment = details.payment || {};
    const passengers = details.passengers || [];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-indigo-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                        <Ticket size={24} />
                        Booking Receipt
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Flight Info */}
                    <section className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">PNR</p>
                                <p className="font-mono font-bold text-lg text-indigo-700">{booking.pnr}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Flight Number</p>
                                <p className="font-bold">{booking.flight_no}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Route</p>
                                <p className="font-medium">{booking.origin} → {booking.destination}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Date</p>
                                <p className="font-medium">{booking.date}</p>
                            </div>
                        </div>
                    </section>

                    {/* Passengers */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Passengers</h3>
                        <div className="space-y-2">
                            {passengers.length > 0 ? passengers.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.gender} | {p.dob || p.age}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">{p.type || 'Adult'}</span>
                                </div>
                            )) : <p className="text-gray-400 italic">No passenger details available</p>}
                        </div>
                    </section>

                    {/* Extra Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Contact</h3>
                            <div className="text-sm space-y-1">
                                <p><span className="text-gray-500">Email:</span> {contact.email || 'N/A'}</p>
                                <p><span className="text-gray-500">Phone:</span> {contact.mobile || 'N/A'}</p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Payment</h3>
                            <div className="text-sm space-y-1">
                                <p><span className="text-gray-500">Method:</span> {payment.method || 'N/A'}</p>
                                <p><span className="text-gray-500">Status:</span> {payment.status || 'Paid'}</p>
                                <p><span className="text-gray-500">Total Price:</span> {booking.price}</p>
                            </div>
                        </section>
                    </div>

                    {/* Addons */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Add-ons & Preferences</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div><span className="text-gray-500">Seat:</span> {extras.seat || 'N/A'}</div>
                            <div><span className="text-gray-500">Meal:</span> {extras.meal || 'N/A'}</div>
                            <div><span className="text-gray-500">Baggage:</span> {extras.baggage || 'Standard'}</div>
                            <div><span className="text-gray-500">Insurance:</span> {extras.insurance || 'No'}</div>
                        </div>
                    </section>
                </div>
                
                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Close</button>
                    <button 
                        onClick={() => onModify(booking)} 
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium whitespace-nowrap"
                    >
                        Modify Booking
                    </button>
                </div>
            </div>
        </div>
    );
};

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const response = await apiFetch('/api/bookings');
            if (response.ok) {
                const data = await response.json();
                setBookings(data.bookings);
            }
        } catch (error) {
            console.error('Failed to fetch bookings', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading bookings...</div>;

    return (
        <div className="p-6 w-full mx-auto h-full overflow-y-auto pr-2">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Ticket className="text-indigo-600" />
                My Bookings
            </h1>

            <div className="space-y-4">
                {bookings.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500">No bookings found yet.</p>
                    </div>
                ) : (
                    bookings.map((booking) => (
                        <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">PNR: {booking.pnr}</div>
                                        <div className="text-lg font-bold text-indigo-900">{booking.origin} → {booking.destination}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium inline-block mb-2">
                                            {booking.status}
                                        </div>
                                        <div className="font-bold text-gray-900">{booking.price}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Ticket size={16} />
                                        <span>{booking.flight_no}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        <span>{booking.date}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedBooking(booking)}
                                    className="w-full mt-2 py-2 border border-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                                >
                                    <Eye size={16} />
                                    View Full Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {selectedBooking && (
                <BookingModal 
                    booking={selectedBooking} 
                    onClose={() => setSelectedBooking(null)} 
                    onModify={(booking) => {
                        setSelectedBooking(null);
                        navigate('/chat', { state: { initialMessage: `I want to modify my booking (PNR: ${booking.pnr})` } });
                    }}
                />
            )}
        </div>
    );
};

export default Bookings;
