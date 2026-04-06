import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, CheckCircle, X } from 'lucide-react';

const PaymentModal = ({ amount, onComplete, onClose }) => {
    const [step, setStep] = useState('select'); // select, processing, success
    const [method, setMethod] = useState('upi');

    const handlePay = () => {
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onComplete(method);
            }, 1000); // Wait 1s before closing/callback
        }, 2000); // 2s processing simulation
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Close Button (only if not processing) */}
                {step === 'select' && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="p-6">
                    {step === 'select' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CreditCard className="text-indigo-600" size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Payment Request</h2>
                                <p className="text-gray-500 text-sm mt-1">Complete your booking securely</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100 flex justify-between items-center">
                                <span className="text-gray-600 font-medium">Total Amount</span>
                                <span className="text-2xl font-bold text-indigo-700">{amount}</span>
                            </div>

                            <div className="space-y-3 mb-6">
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${method === 'upi' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="method"
                                        value="upi"
                                        checked={method === 'upi'}
                                        onChange={() => setMethod('upi')}
                                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="font-medium">UPI / GPay / PhonePe</span>
                                </label>
                                <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${method === 'card' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <input
                                        type="radio"
                                        name="method"
                                        value="card"
                                        checked={method === 'card'}
                                        onChange={() => setMethod('card')}
                                        className="mr-3 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="font-medium">Credit / Debit Card</span>
                                </label>
                            </div>

                            <button
                                onClick={handlePay}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                            >
                                Pay {amount}
                            </button>
                        </>
                    )}

                    {step === 'processing' && (
                        <div className="text-center py-8">
                            <Loader2 className="animate-spin text-indigo-600 h-10 w-10 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-800">Processing Payment</h3>
                            <p className="text-gray-500 text-sm">Please do not close this window...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-8">
                            <CheckCircle className="text-green-500 h-10 w-10 mx-auto mb-4 scale-125 transition-transform" />
                            <h3 className="text-lg font-bold text-gray-800">Payment Successful!</h3>
                            <p className="text-gray-500 text-sm">Redirecting...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
