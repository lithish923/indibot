import React from 'react';
import { Plane, Clock, IndianRupee } from 'lucide-react';

const FlightTicket = ({ flight, onSelect }) => {
    return (
        <div
            onClick={() => onSelect && onSelect(flight)}
            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden transform hover:-translate-y-1 duration-200 mb-3"
        >
            <div className="bg-indigo-600 px-4 py-2 flex justify-between items-center">
                <span className="text-white font-bold text-sm">Indigo</span>
                <span className="text-indigo-100 text-xs font-mono">{flight.flight_no}</span>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{flight.origin}</div>
                        <div className="text-xs text-gray-500 font-medium">{flight.dep_time}</div>
                    </div>

                    <div className="flex-1 px-4 flex flex-col items-center">
                        <div className="text-xs text-gray-400 mb-1">{flight.duration}</div>
                        <div className="w-full h-px bg-gray-300 relative flex items-center justify-center">
                            <Plane className="text-indigo-500 absolute bg-white p-0.5" size={16} />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">{flight.type}</div>
                    </div>

                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{flight.destination}</div>
                        <div className="text-xs text-gray-500 font-medium">{flight.arr_time}</div>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-wider font-semibold">
                        {flight.class || 'Economy'}
                    </div>
                    <div className="flex items-center text-indigo-700 font-bold text-lg">
                        <IndianRupee size={16} />
                        <span>{flight.price.replace(/[^\d,]/g, '')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlightTicket;
