'use client';

import { useState, useRef } from 'react';
import { useContract } from '@/app/hooks/useContract';
import { X, User, Camera, Image, Type, Tag, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

const INTERESTS_OPTIONS = [
  'Technology', 'Blockchain', 'AI', 'Web3', 'DeFi', 'NFTs',
  'Gaming', 'Art', 'Music', 'Sports', 'Travel', 'Food',
  'Science', 'Programming', 'Design', 'Business', 'Finance'
];

export function ProfileEditModal({ isOpen, onClose, onSuccess, user }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    interests: user?.interests || [] as string[],
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState(user?.profileImage || '');
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(user?.coverPhoto || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { contract } = useContract();

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Cover photo must be smaller than 10MB');
      return;
    }

    setCoverPhoto(file);
    setCoverPhotoPreview(URL.createObjectURL(file));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i:any) => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const uploadFileToOG = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/og/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    return result.rootHash;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) {
      toast.error('Contract not available');
      return;
    }

    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    setIsLoading(true);
    try {
      let profileImageCID = user?.profileImage;
      let coverPhotoCID = user?.coverPhoto;

      // Upload profile image if changed
      if (profileImage) {
        profileImageCID = await uploadFileToOG(profileImage);
        const tx1 = await contract.setProfileImage(profileImageCID);
        await tx1.wait();
      }

      // Upload cover photo if changed
      if (coverPhoto) {
        coverPhotoCID = await uploadFileToOG(coverPhoto);
        const tx2 = await contract.setCoverPhoto(coverPhotoCID);
        await tx2.wait();
      }

      // Update bio if changed
      if (formData.bio !== user?.bio) {
        const tx3 = await contract.setBio(formData.bio);
        await tx3.wait();
      }

      // Update username and interests if changed
      if (formData.username !== user?.username || JSON.stringify(formData.interests) !== JSON.stringify(user?.interests || [])) {
        const tx4 = await contract.editProfile(
          formData.username,
          profileImageCID || '',
          formData.bio,
          coverPhotoCID || '',
          formData.interests
        );
        await tx4.wait();
      }

      toast.success('Profile updated successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <p className="text-gray-600 text-sm mt-1">Update your profile information</p>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Cover Photo</label>
            <div 
              className="relative h-32 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl cursor-pointer overflow-hidden group"
              onClick={() => coverInputRef.current?.click()}
            >
              {coverPhotoPreview ? (
                <img 
                  src={coverPhotoPreview} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverPhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Picture */}
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
              <div 
                className="relative w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl cursor-pointer group"
                onClick={() => profileInputRef.current?.click()}
              >
                {profileImagePreview ? (
                  <img 
                    src={profileImagePreview} 
                    alt="Profile preview" 
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <input
                type="file"
                ref={profileInputRef}
                onChange={handleProfileImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">
                Click on the profile picture to upload a new one. Recommended size: 400x400px
              </p>
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-900 mb-2">
              Username *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-3 text-gray-900 w-5 h-5" />
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell everyone about yourself..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none min-h-[100px]"
                maxLength={160}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {formData.bio.length}/160
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Tag className="w-4 h-4 inline mr-1" />
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select interests that describe you. This helps others discover your content.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-100">
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
              disabled={isLoading || !formData.username.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}