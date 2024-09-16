'use client';
import { Button } from '@/components/Button';
import { MxLink } from '@/components/MxLink';
import { logout } from '@/helpers';
import { useGetIsLoggedIn } from '@/hooks';
import { RouteNamesEnum } from '@/localConstants';
import mvxLogo from '../../../../public/assets/img/multiversx-symbol.svg';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getWindowLocation } from '@/utils/sdkDappUtils';
import { usePathname } from 'next/navigation';
import { Gamepad2, LogOut } from 'lucide-react';

export const Header = () => {
  const router = useRouter();
  const isLoggedIn = useGetIsLoggedIn();
  const pathname = usePathname();

  const isUnlockRoute = Boolean(pathname === RouteNamesEnum.unlock);

  const ConnectButton = isUnlockRoute ? null : (
    <MxLink
      to={RouteNamesEnum.unlock}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-md hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ease-in-out transform hover:scale-105"
    >
      <Gamepad2 className="w-4 h-4 mr-2" />
      Connect
    </MxLink>
  );

  const onRedirect = () => {
    router.replace(RouteNamesEnum.unlock);
  };

  const handleLogout = () => {
    const { href } = getWindowLocation();
    sessionStorage.clear();
    logout(href, onRedirect, false);
  };

  return (
    <header className='flex flex-row items-center justify-between px-6 py-4 bg-gray-900 text-white'>
      <MxLink
        to={isLoggedIn ? RouteNamesEnum.dashboard : RouteNamesEnum.home}
        className='flex items-center justify-between'
      >
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 filter blur-md opacity-50"></div>
          <Image src={mvxLogo} alt='logo' className='w-auto h-8 relative z-10' />
        </div>
        <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-500">
          QxFlamies
        </span>
      </MxLink>

      <nav className='flex items-center space-x-4'>
        <div className='flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-1'>
          <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
        </div>

        {isLoggedIn ? (
          <Button
            onClick={handleLogout}
            className='inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 ease-in-out'
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        ) : (
          ConnectButton
        )}
      </nav>
    </header>
  );
};