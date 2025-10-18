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
    <header className="glass border-b border-white/20 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:border-white/40 transition-all duration-300">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-50 group-hover:opacity-70 transition duration-300"></div>
            </div>
            <span className="font-bold text-xl text-white text-glow group-hover:text-blue-200 transition-colors">
              ChainChat
            </span>
          </Link>

          {/* Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink href="/" icon={Home} label="Feed" isActive={isActive('/')} />
              <NavLink href="/post/create" icon={PlusCircle} label="Create" isActive={isActive('/post/create')} />
              <NavLink href="/rewards" icon={Trophy} label="Rewards" isActive={isActive('/rewards')} />
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
                    <Search className="w-4 h-4 text-white/60 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search ChainChat..."
                      className="pl-10 pr-4 py-2 glass-input rounded-xl text-white placeholder-white/40 text-sm focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 w-48"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <button className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200 relative group">
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white/20"></div>
                </button>

                <div className="hidden sm:flex items-center space-x-2 text-sm text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </>
            )}
            
            {/* Enhanced Connect Button */}
            <div className="glass rounded-xl hover:shadow-lg transition-all duration-200">
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
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 group ${
        isActive 
          ? 'text-white bg-white/20 border border-white/30' 
          : 'text-white/80 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${isActive ? 'text-blue-300' : ''}`} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}