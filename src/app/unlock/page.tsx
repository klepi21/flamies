'use client';
import React from 'react';
import { RouteNamesEnum } from '@/localConstants';
import type {
  ExtensionLoginButtonPropsType,
  WebWalletLoginButtonPropsType,
  OperaWalletLoginButtonPropsType,
  LedgerLoginButtonPropsType,
  WalletConnectLoginButtonPropsType
} from '@multiversx/sdk-dapp/UI';
import {
  ExtensionLoginButton,
  LedgerLoginButton,
  WalletConnectLoginButton,
  WebWalletLoginButton as WebWalletUrlLoginButton,
  OperaWalletLoginButton,
  CrossWindowLoginButton
} from '@/components';
import { nativeAuth } from '@/config/config.mainnet';
import { AuthRedirectWrapper } from '@/wrappers';
import { useRouter } from 'next/navigation';
import { Gamepad2, Smartphone, Key, Wallet, Globe, CreditCard } from 'lucide-react';

type CommonPropsType =
  | OperaWalletLoginButtonPropsType
  | ExtensionLoginButtonPropsType
  | WebWalletLoginButtonPropsType
  | LedgerLoginButtonPropsType
  | WalletConnectLoginButtonPropsType;

const USE_WEB_WALLET_CROSS_WINDOW = true;

const WebWalletLoginButton = USE_WEB_WALLET_CROSS_WINDOW
  ? CrossWindowLoginButton
  : WebWalletUrlLoginButton;

export default function Unlock() {
  const router = useRouter();
  const commonProps: CommonPropsType = {
    callbackRoute: RouteNamesEnum.dashboard,
    nativeAuth,
    onLoginRedirect: () => {
      router.push(RouteNamesEnum.dashboard);
    }
  };

  const buttonClass = "flex items-center justify-center w-full px-6 py-3 mb-3 text-sm font-medium text-white transition-all duration-300 ease-in-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:shadow-lg";

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <div className='flex justify-center items-center min-h-screen bg-gray-900 px-4'>
        <div
          className='w-full max-w-md p-8 rounded-2xl bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg border border-gray-700 shadow-2xl'
          data-testid='unlockPage'
        >
          <div className='flex flex-col items-center gap-4 mb-8'>
            <Gamepad2 className="w-16 h-16 text-blue-500" />
            <h2 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600'>Connect Your Wallet</h2>
            <p className='text-center text-gray-400'>Choose your preferred login method to start gaming</p>
          </div>

          <div className='flex flex-col items-center w-full'>
            <WalletConnectLoginButton
              loginButtonText='xPortal App'
              {...commonProps}
              className={`${buttonClass} bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900`}
            >
              <span className="flex items-center justify-center">
                <Smartphone className="w-5 h-5 mr-2" />
                <span>xPortal App</span>
              </span>
            </WalletConnectLoginButton>
            
            <LedgerLoginButton
              loginButtonText='Ledger'
              {...commonProps}
              className={`${buttonClass} bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900`}
            >
              <span className="flex items-center justify-center">
                <Key className="w-5 h-5 mr-2" />
                <span>Ledger</span>
              </span>
            </LedgerLoginButton>
            
            <ExtensionLoginButton
              loginButtonText='DeFi Wallet'
              {...commonProps}
              className={`${buttonClass} bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900`}
            >
              <span className="flex items-center justify-center">
                <Wallet className="w-5 h-5 mr-2" />
                <span>DeFi Wallet</span>
              </span>
            </ExtensionLoginButton>
            
            <OperaWalletLoginButton
              loginButtonText='Opera Crypto Wallet'
              {...commonProps}
              className={`${buttonClass} bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900`}
            >
              <span className="flex items-center justify-center">
                <Globe className="w-5 h-5 mr-2" />
                <span>Opera Crypto Wallet</span>
              </span>
            </OperaWalletLoginButton>
            
            <WebWalletLoginButton
              loginButtonText='Web Wallet'
              data-testid='webWalletLoginBtn'
              {...commonProps}
              className={`${buttonClass} bg-gradient-to-r from-yellow-600 to-yellow-800 hover:from-yellow-700 hover:to-yellow-900`}
            >
              <span className="flex items-center justify-center">
                <CreditCard className="w-5 h-5 mr-2" />
                <span>Web Wallet</span>
              </span>
            </WebWalletLoginButton>
          </div>
        </div>
      </div>
    </AuthRedirectWrapper>
  );
}