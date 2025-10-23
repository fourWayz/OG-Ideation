'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  PlusCircle, 
  User, 
  Trophy,
  Sparkles,
  Bell,
  Search
} from 'lucide-react';
import { useUserRegistration } from '@/app/hooks/useUserRegistration';

export function Header() {
  const { isConnected } = useAccount();
  const { isRegistered } = useUserRegistration();
  const pathname = usePathname();

  const showNavigation = isConnected && isRegistered;

  const isActive = (path: string) => pathname === path;

  return (
    <header className="glass border-b border-gray-200/50 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/40 group-hover:border-white/60 transition-all duration-300 shadow-sm">
                <Sparkles className="w-4 h-4 text-gray-700 group-hover:scale-110 transition-transform" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-lg blur opacity-50 group-hover:opacity-70 transition duration-300"></div>
            </div>
            <span className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
              ChainChatAI
            </span>
          </Link>

          {/* Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink href="/" icon={Home} label="Feed" isActive={isActive('/')} />
              <NavLink href="#" icon={PlusCircle} label="Create" isActive={isActive('/post/create')} />
              <NavLink href="#" icon={Trophy} label="Rewards" isActive={isActive('/rewards')} />
              <NavLink href="/profile" icon={User} label="Profile" isActive={isActive('/profile')} />
            </nav>
          )}

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {showNavigation && (
              <>
                {/* Search Bar */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search ChainChat..."
                      className="pl-10 pr-4 py-2 glass-input rounded-xl text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-300 transition-all duration-200 w-48"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <button className="p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-white/80 transition-all duration-200 relative group backdrop-blur-sm border border-transparent hover:border-white/60">
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                </button>

                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </>
            )}
            
            {/* Enhanced Connect Button */}
            <div className="glass rounded-xl hover:shadow-lg transition-all duration-200 border border-white/40">
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
                accountStatus="full"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, icon: Icon, label, isActive }: { href: string; icon: any; label: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 group backdrop-blur-sm ${
        isActive 
          ? 'text-gray-900 bg-white/80 border border-white/60 shadow-sm' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-white/80 border border-transparent hover:border-white/60'
      }`}
    >
      <Icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${isActive ? 'text-blue-600' : ''}`} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}