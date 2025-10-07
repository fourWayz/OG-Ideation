'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useUserProfile } from '@/app/hooks/useUserProfile';
import { useUserRegistration } from '@/app/hooks/useUserRegistration';
import { User, Edit3, Camera, Mail, Calendar, Save, X } from 'lucide-react';
import { LoadingSpinner, ProfileSkeleton } from '@/app/components/ui/LoadingSpinner';
import { formatTokenAmount, truncateAddress } from '@/app/lib/utils';
import { ProfileEditModal } from '@/app/components/profile/ProfileEditModal';

export default function ProfilePage() {
  const { address } = useAccount();
  const { data: user, isLoading, refetch } = useUserProfile(address);
  const { isRegistered } = useUserRegistration();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!isRegistered) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Available</h2>
          <p className="text-gray-600">Please register to view and edit your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  const handleProfileUpdate = () => {
    refetch(); // Refresh profile data
    setIsEditModalOpen(false);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-20 overflow-hidden">
          {user.coverPhoto ? (
            <img 
              src={user.coverPhoto} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-purple-500"></div>
          )}
          
          {/* Profile Picture */}
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.username}
                  className="w-32 h-32 rounded-2xl border-4 border-white bg-white object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl border-4 border-white flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="absolute top-6 right-6">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-500 mb-2">{user.username}</h1>
            <p className="text-gray-600 text-lg mb-4">{user.bio || "No bio yet. Tell everyone about yourself!"}</p>
            
            {/* Wallet Address */}
            <div className="flex items-center space-x-2 text-gray-500">
              <Mail className="w-4 h-4" />
              <span className="font-mono">{truncateAddress(user.userAddress || address || '')}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard label="Posts" value={user.postCount} />
            <StatCard label="Likes Given" value={user.likeCount} />
            <StatCard label="Comments" value={user.commentCount} />
            <StatCard label="Shares" value={user.shareCount} />
          </div>

          {/* Token Balance */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">CC</span>
              </div>
              <span>Token Balance</span>
            </h3>
            <div className="text-3xl font-bold text-gray-900">
              {formatTokenAmount(user.balance)} CC
            </div>
            <p className="text-gray-600 text-sm mt-2">
              Earn more tokens by creating content and engaging with the community
            </p>
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest:any, index:any) => (
                  <span 
                    key={index}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Your Interests</h3>
              <p className="text-gray-600 text-sm mb-4">
                Let others know what you're interested in to find like-minded people
              </p>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                Edit profile to add interests
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleProfileUpdate}
        user={user}
      />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}