'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
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
  const { address, isConnected } = useAccount();
  const { contract } = useContract();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !address || !contract) return;

    setIsLoading(true);
    try {
      console.log('Starting registration for:', username);
      
      // Call the registerUser function from the contract
      const tx = await contract.registerUser(address, username.trim());
      
      toast.loading('Registering on blockchain...', { id: 'register' });
      // console.log('Transaction sent:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      
      toast.success('Registration successful! Welcome to ChainChat!', { id: 'register' });
      console.log('Registration completed successfully');
      
      onSuccess();
      onClose();
      setUsername('');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      if (error?.message?.includes('User is already registered')) {
        toast.error('This wallet is already registered', { id: 'register' });
        onSuccess(); // User is actually registered, proceed
      } else if (error?.message?.includes('Username required')) {
        toast.error('Please enter a username', { id: 'register' });
      } else if (error?.message?.includes('user rejected transaction')) {
        toast.error('Transaction was cancelled', { id: 'register' });
      } else {
        toast.error('Registration failed. Please try again.', { id: 'register' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-3xl max-w-md w-full animate-scale-in">
        {/* Header */}
        <div className="relative p-8 border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl flex items-center justify-center border border-white/20">
              <Sparkles className="w-7 h-7 text-gray" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray mb-1">Join ChainChat</h2>
              <p className="text-gray/70">Create your account to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray/60 hover:text-gray rounded-xl hover:bg-white/10 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray/80 mb-3">
              Choose a username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray/40 w-5 h-5" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-12 pr-4 py-4 glass-input rounded-xl focus:ring-2 focus:ring-white/50 text-gray placeholder-white/40 transition-colors"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <p className="text-xs text-gray/50 mt-2">
              Username must be 3-30 characters (letters, numbers, underscores only)
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white/10 rounded-xl p-4 space-y-2 border border-white/20">
            <h3 className="font-semibold text-gray text-sm">You'll receive:</h3>
            <ul className="text-gray/70 text-sm space-y-1">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>100 CC token signup bonus</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>10 free posts to get started</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>AI-powered personalized feed</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 border border-white/20 text-gray/80 rounded-xl font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!username.trim() || isLoading}
              className="flex-1 px-4 py-4 bg-gradient-to-r from-white/30 to-white/10 text-gray rounded-xl font-semibold hover:bg-white/20 border border-white/20 hover:border-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Registering...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}