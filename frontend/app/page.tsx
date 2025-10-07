'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { WelcomeCard } from '@/app/components/feed/WelcomeCard';
import { CreatePostCard } from '@/app/components/feed/CreatePostCard';
import { Feed } from '@/app/components/feed/Feed';
import { TokenStats } from '@/app/components/feed/TokenStats';
import { RegistrationModal } from '@/app/components/auth/RegistrationModal';
import { useUserRegistration } from '@/app/hooks/useUserRegistration';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const { isRegistered, isLoading, hasChecked } = useUserRegistration();
  const [showRegistration, setShowRegistration] = useState(false);

  // Show registration modal only once when user connects but isn't registered
  useEffect(() => {
    if (isConnected && hasChecked && !isRegistered && !isLoading) {
      setShowRegistration(true);
    }
  }, [isConnected, isRegistered, isLoading, hasChecked]);

  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
  };

  // Show loading while checking registration status
  if (isConnected && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Checking your account...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <WelcomeCard />;
  }

  if (!isRegistered && hasChecked) {
    return (
      <>
        <RegistrationModal
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          onSuccess={handleRegistrationSuccess}
        />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">👋</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
            <p className="text-gray-600 mb-6">
              You need to register to start using ChainChat. Click the button below to create your account.
            </p>
            <button
              onClick={() => setShowRegistration(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
            >
              Create Account
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CreatePostCard />
            <Feed />
          </div>
          <div className="space-y-6">
            <TokenStats />
          </div>
        </div>
      </div>
    </>
  );
}