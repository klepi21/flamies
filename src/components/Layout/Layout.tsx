'use client';
import { PropsWithChildren } from 'react';
import { AuthenticatedRoutesWrapper } from '@multiversx/sdk-dapp/wrappers/AuthenticatedRoutesWrapper/AuthenticatedRoutesWrapper';
import { RouteNamesEnum } from '@/localConstants';
import { routes } from '@/routes';
import { Footer } from './Footer';
import { Header } from './Header';

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className='flex min-h-screen flex-col bg-gray-900 text-cyan-400 relative overflow-hidden'>
      <div className='absolute inset-0 bg-[url("/grid.svg")] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]'></div>
      <div className='flex flex-col min-h-screen relative z-10'>
        <div className='bg-gradient-to-b from-gray-100 to-gray-300'>
          <Header />
        </div>
        <main className='flex-grow flex justify-center p-4 relative'>
          <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500'></div>
          <AuthenticatedRoutesWrapper
            routes={routes}
            unlockRoute={`${RouteNamesEnum.unlock}`}
          >
            {children}
          </AuthenticatedRoutesWrapper>
        </main>
        <Footer />
      </div>
    </div>
  );
};