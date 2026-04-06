import React from 'react';
import { CheckCircle, Plane, User, Armchair } from 'lucide-react';

const BookingConfirmation = ({ details }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden my-4 max-w-sm mx-auto">
            <div className="bg-green-500 p-4 text-center">
                <CheckCircle className="text-white h-12 w-12 mx-auto mb-2" />
                <h3 className="text-white font-bold text-xl">Booking Confirmed</h3>
                <p className="text-green-100 text-sm">Have a safe journey!</p>
            </div>

            <div className="p-6 space-y-4">
                <div className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-500 text-sm">PNR Number</span>
                    <span className="font-mono font-bold text-lg text-gray-800">{details.pnr}</span>
                </div>

                <div className="flex items-center space-x-3">
                    <Plane className="text-indigo-500" size={20} />
                    <div>
                        <p className="text-xs text-gray-500">Flight</p>
                        <p className="font-semibold text-gray-800">{details.flight_no}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <User className="text-indigo-500" size={20} />
                    <div>
                        <p className="text-xs text-gray-500">Passenger</p>
                        <p className="font-semibold text-gray-800">
                            {details.passengers && details.passengers.length > 0
                                ? details.passengers.map(p => p.name).join(', ')
                                : details.passenger || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <Armchair className="text-indigo-500" size={20} />
                    <div>
                        <p className="text-xs text-gray-500">Seat</p>
                        <p className="font-semibold text-gray-800">
                            {details.extras?.seat || details.seat || 'Any'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 text-center">
                <p className="text-xs text-gray-400">Boarding closes 45 mins before departure</p>
            </div>
        </div>
    );
};

export default BookingConfirmation;
