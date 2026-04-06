import React from 'react';
import { Plane, Calendar, User, Check } from 'lucide-react';

const BookingReview = ({ details, onConfirm }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-4 w-full max-w-md">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 text-white">
                <h3 className="font-bold flex items-center gap-2">
                    <Check size={18} />
                    Review Your Booking
                </h3>
            </div>

            <div className="p-4 space-y-4">
                {/* Flight Header */}
                <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{details.origin} <span className="text-gray-400">→</span> {details.destination}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar size={14} />
                            {details.date}
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            {details.dep_time} - {details.arr_time}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded inline-block">
                            {details.flight_no}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{details.class}</p>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    {/* Passengers */}
                    <div className="col-span-2">
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Passengers</p>
                        {details.passengers.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-gray-700">
                                <User size={14} className="text-gray-400" />
                                <span className="font-medium">{p.name}</span>
                                <span className="text-gray-400 text-xs">({p.gender}, {p.age || p.dob})</span>
                            </div>
                        ))}
                    </div>

                    {/* Extras */}
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Add-ons</p>
                        <ul className="text-gray-600 space-y-1">
                            <li>Seat: <span className="font-medium">{details.extras.seat || 'N/A'}</span></li>
                            <li>Meal: <span className="font-medium">{details.extras.meal || 'N/A'}</span></li>
                        </ul>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-1">&nbsp;</p>
                        <ul className="text-gray-600 space-y-1">
                            <li>Bag: <span className="font-medium">{details.extras.baggage || 'Standard'}</span></li>
                            <li>Ins: <span className="font-medium">{details.extras.insurance || 'No'}</span></li>
                        </ul>
                    </div>
                </div>

                {/* Footer Total */}
                <div className="bg-gray-50 -mx-4 -mb-4 p-4 flex justify-between items-center border-t border-gray-100 mt-2">
                    <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="text-xl font-bold text-indigo-700">{details.total_price}</p>
                    </div>
                    <button
                        onClick={onConfirm}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Confirm Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingReview;
