import React from 'react';
import FlightTicket from './FlightTicket';
import BookingReview from './BookingReview';
import BookingConfirmation from './BookingConfirmation';

const MessageRenderer = ({ text, onFlightSelect, onReviewConfirm, onPaymentRequest, isHistory = false, isUser = false }) => {
    // 1. Check for JSON code block ```json ... ```
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);

    const textColor = isUser ? "text-indigo-50" : "text-gray-700";
    const strongColor = isUser ? "text-white" : "text-gray-900";
    const subTextColor = isUser ? "text-indigo-200" : "text-gray-500";
    const bulletColor = isUser ? "text-indigo-300" : "text-gray-400";

    // Default formatting function
    const formatMessage = (content) => {
        if (!content) return null;

        // Normalize newlines (handle literal \n and real \n)
        const normalizedText = content.replace(/\\n/g, '\n');

        return normalizedText.split('\n').map((line, lineIdx) => {
            // Check if line is a bullet point
            const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim());

            let cleanLine = line;
            let prefix = null;

            if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                cleanLine = line.trim().substring(2);
                prefix = <span className={`${bulletColor} mt-1 mr-2`}>•</span>;
            } else if (!isUser && /^\d+\.\s/.test(line.trim())) {
                // Numbered list support
                const match = line.trim().match(/^(\d+\.)\s(.*)/);
                if (match) {
                    prefix = <span className={`${subTextColor} font-medium mt-0 mr-2 min-w-[1.5em]`}>{match[1]}</span>;
                    cleanLine = match[2];
                }
            }

            // Split by bold syntax (**text**)
            const parts = cleanLine.split(/(\*\*.*?\*\*)/g);

            const formattedLine = parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={partIdx} className={`font-bold ${strongColor}`}>{part.slice(2, -2)}</strong>;
                }
                return <span key={partIdx}>{part}</span>;
            });

            if (prefix) {
                return (
                    <div key={lineIdx} className="flex items-start mb-1">
                        {prefix}
                        <div className="flex-1">{formattedLine}</div>
                    </div>
                );
            }

            return (
                <div key={lineIdx} className="min-h-[1.5em] mb-1 last:mb-0">
                    {formattedLine}
                </div>
            );
        });
    };

    if (jsonMatch) {
        try {
            const jsonContent = JSON.parse(jsonMatch[1]);
            const textWithoutJson = text.replace(/```json\s*[\s\S]*?\s*```/, '').trim();

            const TextSection = () => (
                <div className={`mb-2 text-sm leading-relaxed ${textColor}`}>
                    {formatMessage(textWithoutJson)}
                </div>
            );

            // 2. Determine type of JSON
            if (Array.isArray(jsonContent)) {
                // Flight List
                return (
                    <div className="space-y-3 w-full max-w-md">
                        {textWithoutJson && <TextSection />}
                        <div className="space-y-3">
                            {jsonContent.map((flight, idx) => (
                                <div key={idx} className={isHistory ? "opacity-75 pointer-events-none grayscale-[0.5]" : ""}>
                                    <FlightTicket
                                        flight={flight}
                                        onSelect={!isHistory ? onFlightSelect : undefined}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            } else if (jsonContent.status === 'review') {
                // Review Summary
                return (
                    <div>
                        {textWithoutJson && <TextSection />}
                        <div className={isHistory ? "opacity-75 pointer-events-none" : ""}>
                            <BookingReview
                                details={jsonContent}
                                onConfirm={!isHistory ? onReviewConfirm : undefined}
                            />
                        </div>
                    </div>
                );
            } else if (jsonContent.status === 'payment_request') {
                // Payment Request
                return (
                    <div>
                        {textWithoutJson && <TextSection />}
                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <p className="font-bold text-lg text-indigo-900 mb-2">{jsonContent.amount}</p>
                            {!isHistory ? (
                                <button
                                    onClick={() => onPaymentRequest(jsonContent)}
                                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors w-full"
                                >
                                    Pay Now
                                </button>
                            ) : (
                                <div className="text-gray-400 text-sm font-medium border-t pt-2 mt-2">
                                    Payment request (Archived)
                                </div>
                            )}
                        </div>
                    </div>
                );
            } else if (jsonContent.status === 'confirmed') {
                // Confirmation
                return (
                    <div>
                        {textWithoutJson && <TextSection />}
                        <BookingConfirmation details={jsonContent} />
                    </div>
                );
            }
        } catch (e) {
            console.error("Failed to parse JSON from AI", e);
            return <div className="text-red-500">Error displaying content</div>;
        }
    }

    // Default Rendering
    return <div className={`text-sm leading-relaxed ${textColor}`}>{formatMessage(text)}</div>;
};

export default MessageRenderer;
