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
  const { isRegistered, isLoading, isFetched, refetchRegistration } = useUserRegistration();
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationChecked, setRegistrationChecked] = useState(false);

  console.log('🔄 Page State:', {
    isConnected,
    address,
    isRegistered,
    isLoading,
    isFetched,
    showRegistration,
    registrationChecked
  });

  // Only check registration status after we have all required data
  useEffect(() => {
    if (isConnected && isFetched && !isLoading) {
      console.log('🎯 Registration check complete - isRegistered:', isRegistered);
      
      if (!isRegistered && !registrationChecked) {
        console.log('👤 User needs registration');
        setShowRegistration(true);
        setRegistrationChecked(true);
      } else if (isRegistered) {
        console.log('✅ User is registered, hiding modal');
        setShowRegistration(false);
        setRegistrationChecked(true);
      }
    }
  }, [isConnected, isRegistered, isLoading, isFetched, registrationChecked]);

  // Reset when wallet disconnects or changes
  useEffect(() => {
    if (!isConnected) {
      setRegistrationChecked(false);
      setShowRegistration(false);
    }
  }, [isConnected, address]);

  const handleRegistrationSuccess = () => {
    console.log('🎉 Registration success!');
    setShowRegistration(false);
    // Force refresh all data
    setTimeout(() => {
      refetchRegistration();
    }, 1000);
  };

  const handleCloseRegistration = () => {
    console.log('❌ Registration modal closed by user');
    setShowRegistration(false);
    setRegistrationChecked(true);
  };

  // Show loading while checking connection and registration
  if (isConnected && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 border-white" />
          <p className="text-white/80">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Not connected - show welcome screen
  if (!isConnected) {
    return <WelcomeCard />;
  }

  // Still loading initial data
  if (!isFetched) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4 border-white" />
          <p className="text-white/80">Checking registration status...</p>
        </div>
      </div>
    );
  }

  // User needs registration
  if (!isRegistered && isFetched) {
    return (
      <>
        <RegistrationModal
          isOpen={showRegistration}
          onClose={handleCloseRegistration}
          onSuccess={handleRegistrationSuccess}
        />
        
        {/* Registration Prompt Screen */}
        {!showRegistration && (
          <div className="min-h-screen flex items-center justify-center px-4">
            <div className="glass-card rounded-3xl p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-r from-white/30 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <span className="text-2xl">👋</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Welcome to ChainChat!</h1>
              <p className="text-white/80 mb-6 leading-relaxed">
                You're connected with your wallet. To start using ChainChat, you need to create your account.
              </p>
              <button
                onClick={() => setShowRegistration(true)}
                className="w-full bg-gradient-to-r from-white/30 to-white/10 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 border border-white/20 transition-all duration-200 mb-4"
              >
                Create Account
              </button>
              <p className="text-white/60 text-sm">
                Get 100 CC tokens and 10 free posts when you register!
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Main app - user is registered and everything is loaded
  console.log('🏠 Rendering main app for registered user');
  return (
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
  );
}