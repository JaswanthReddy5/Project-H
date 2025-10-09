/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { FaPhone, FaTimes, FaBackspace, FaVolumeUp, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

export const CallPad = ({ isOpen, onClose, phoneNumber, sellerName }) => {
  const [displayNumber, setDisplayNumber] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (isOpen && phoneNumber) {
      setDisplayNumber(phoneNumber);
      setCallDuration(0);
      setIsCalling(false);
      setIsMuted(false);
    }
  }, [isOpen, phoneNumber]);

  useEffect(() => {
    let interval;
    if (isCalling) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNumberClick = (number) => {
    setDisplayNumber(prev => prev + number);
  };

  const handleBackspace = () => {
    setDisplayNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (displayNumber) {
      setIsCalling(true);
      // Simulate call initiation
      setTimeout(() => {
        // In a real app, this would integrate with WebRTC or phone services
        window.location.href = `tel:${displayNumber}`;
      }, 1000);
    }
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setCallDuration(0);
    onClose();
  };

  const handleMuteToggle = () => {
    setIsMuted(prev => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0a0f1e] text-white rounded-2xl p-6 w-full max-w-sm mx-4 border border-cyan-400">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-cyan-400">Call Pad</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Call Status */}
        {isCalling ? (
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <FaPhone size={24} />
            </div>
            <h3 className="text-lg font-semibold">{sellerName || 'Unknown'}</h3>
            <p className="text-gray-400">{displayNumber}</p>
            <p className="text-cyan-400 text-sm mt-2">{formatDuration(callDuration)}</p>
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhone size={24} />
            </div>
            <h3 className="text-lg font-semibold">{sellerName || 'Unknown'}</h3>
            <p className="text-gray-400">{displayNumber || 'Enter number'}</p>
          </div>
        )}

        {/* Number Display */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="text-2xl font-mono">{displayNumber || '0'}</p>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((key) => (
            <button
              key={key}
              onClick={() => handleNumberClick(key.toString())}
              className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 text-xl font-semibold transition-colors"
              disabled={isCalling}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {isCalling ? (
            <>
              <button
                onClick={handleMuteToggle}
                className={`p-4 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                }`}
              >
                {isMuted ? <FaMicrophoneSlash size={20} /> : <FaMicrophone size={20} />}
              </button>
              <button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 p-4 rounded-full transition-colors"
              >
                <FaPhone size={20} />
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-500 p-4 rounded-full transition-colors"
              >
                <FaVolumeUp size={20} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBackspace}
                className="bg-gray-600 hover:bg-gray-500 p-4 rounded-full transition-colors"
                disabled={!displayNumber}
              >
                <FaBackspace size={20} />
              </button>
              <button
                onClick={handleCall}
                className="bg-green-500 hover:bg-green-600 p-4 rounded-full transition-colors disabled:opacity-50"
                disabled={!displayNumber}
              >
                <FaPhone size={20} />
              </button>
            </>
          )}
        </div>

        {/* Call Actions */}
        {!isCalling && (
          <div className="mt-4 text-center">
            <button
              onClick={() => window.location.href = `tel:${displayNumber}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Open Phone App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
