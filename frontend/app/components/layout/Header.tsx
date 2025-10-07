'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { 
  Home, 
  PlusCircle, 
  User, 
  Trophy,
  Sparkles 
} from 'lucide-react';
import { useUserRegistration } from '@/app/hooks/useUserRegistration';

export function Header() {
  const { isConnected } = useAccount();
  const { isRegistered } = useUserRegistration();

  return (
    <header className="glass border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-r from-white/30 to-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-white/10 rounded-lg blur opacity-50 group-hover:opacity-70 transition duration-300"></div>
            </div>
            <span className="font-bold text-xl text-white text-glow">
              ChainChat
            </span>
          </Link>

          {/* Navigation */}
          {isConnected && isRegistered && (
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink href="/" icon={Home} label="Feed" />
              {/* <NavLink href="/post/create" icon={PlusCircle} label="Create" /> */}
              {/* <NavLink href="/rewards" icon={Trophy} label="Rewards" /> */}
              <NavLink href="/profile" icon={User} label="Profile" />
            </nav>
          )}

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            {isConnected && isRegistered && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            )}
            <div className="glass rounded-xl">
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

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 group backdrop-blur-sm"
    >
      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}