'use client';

import { useState } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useContract } from '@/app/hooks/useContract';
import { X, User, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegistrationModal({ isOpen, onClose, onSuccess }: RegistrationModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const { contract } = useContract();
  const publicClient = usePublicClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !address || !contract) return;

    setIsLoading(true);
    try {
      // Call the registerUser function from the contract
      const tx = await contract.registerUser(address, username.trim());
      console.log(tx, 'Registration transaction sent');
      toast.loading('Registering...', { id: 'register' });
      
      // Wait for transaction confirmation
      await tx.wait();
      
      toast.success('Registration successful! Welcome to ChainChat!', { id: 'register' });
      onSuccess();
      onClose();
      setUsername('');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error?.message?.includes('User is already registered')) {
        toast.error('This wallet is already registered', { id: 'register' });
      } else if (error?.message?.includes('Username required')) {
        toast.error('Please enter a username', { id: 'register' });
      } else {
        toast.error('Registration failed. Please try again.', { id: 'register' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Join ChainChat</h2>
              <p className="text-gray-600 text-sm">Create your account to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Choose a username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Username must be 3-30 characters and can only contain letters, numbers, and underscores
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-blue-900 text-sm">You'll receive:</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>100 CC token signup bonus</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>10 free posts to get started</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>AI-powered personalized feed</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!username.trim() || isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}