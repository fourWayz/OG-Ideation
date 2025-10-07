'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useContract } from '@/app/hooks/useContract';
import { User, Camera, Image, Type } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProfileSetupProps {
  onComplete: () => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    bio: '',
    profileImage: null as File | null,
    coverPhoto: null as File | null,
    interests: [] as string[],
  });
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const { contract } = useContract();

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, profileImage: file }));
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, coverPhoto: file }));
    }
  };

  const handleSubmit = async () => {
    if (!contract || !address) return;

    setIsLoading(true);
    try {
      // Upload profile image if provided
      if (profileData.profileImage) {
        // TODO: Upload to 0G Storage and get CID
        // const profileImageCID = await ogStorage.uploadFile(profileData.profileImage);
        // await contract.setProfileImage(profileImageCID);
      }

      // Upload cover photo if provided
      if (profileData.coverPhoto) {
        // TODO: Upload to 0G Storage and get CID
        // const coverPhotoCID = await ogStorage.uploadFile(profileData.coverPhoto);
        // await contract.setCoverPhoto(coverPhotoCID);
      }

      // Set bio if provided
      if (profileData.bio) {
        await contract.setBio(profileData.bio);
      }

      toast.success('Profile setup complete!');
      onComplete();
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error('Failed to setup profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600">Add some personal touches to your profile (optional)</p>
        </div>

        {/* Step indicators */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    step > stepNumber ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Add a Bio</h3>
            <div className="relative">
              <Type className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell everyone about yourself..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[100px]"
                maxLength={160}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {profileData.bio.length}/160
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                onChange={handleProfileImageChange}
                accept="image/*"
                className="hidden"
                id="profile-image"
              />
              <label
                htmlFor="profile-image"
                className="cursor-pointer bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Choose Image
              </label>
              {profileData.profileImage && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {profileData.profileImage.name}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Cover Photo</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                onChange={handleCoverPhotoChange}
                accept="image/*"
                className="hidden"
                id="cover-photo"
              />
              <label
                htmlFor="cover-photo"
                className="cursor-pointer bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Choose Cover Photo
              </label>
              {profileData.coverPhoto && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {profileData.coverPhoto.name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-8">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>

        {/* Skip option */}
        <div className="text-center pt-4">
          <button
            onClick={onComplete}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}