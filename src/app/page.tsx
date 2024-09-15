'use client';

import { AuthRedirectWrapper, PageWrapper } from '@/wrappers';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Home({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();

  useEffect(() => {
    if (searchParams && Object.keys(searchParams).length > 0) {
      router.replace('/');
    }
  }, [router, searchParams]);

  return (
    <AuthRedirectWrapper requireAuth={false}>
      <PageWrapper>
        <div className='flex flex-col items-center justify-center min-h-screen bg-transparent text-white'>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='text-center mb-12'
          >
            <h1 className='text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-orange-500'>
              QuantumXFlamies
            </h1>
            <p className='text-xl text-gray-400'>
              Where Quantum Meets Fire in a Vintage Turn-Based Adventure
            </p>
          </motion.div>

          <div className='flex flex-col-reverse sm:flex-row items-center justify-center w-full max-w-6xl px-4 gap-8'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='w-full sm:w-1/2'
            >
              <h2 className='text-3xl font-semibold mb-4 text-blue-300'>Welcome to QuantumXFlamies</h2>
              <p className='text-gray-400 mb-6'>
                Embark on a nostalgic journey where quantum mechanics intertwines with fiery creatures. 
                QuantumXFlamies offers a unique gaming experience that combines cutting-edge blockchain technology 
                with the charm of classic turn-based gameplay. Built on the{' '}
                <a
                  href='https://multiversx.com/'
                  target='_blank'
                  rel="noopener noreferrer"
                  className='text-orange-400 hover:text-orange-300 transition-colors'
                >
                  MultiversX
                </a>{' '}
                blockchain, this game brings a vintage feel to the world of Web3.
              </p>
              <p className='text-gray-400 mb-6'>
                Experience the thrill of strategic combat with a retro twist. Each turn is a chance to unleash 
                quantum abilities or harness the power of flames. Will you master the delicate balance between 
                these forces and emerge victorious?
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='bg-gradient-to-r from-blue-500 to-orange-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 hover:from-blue-600 hover:to-orange-600'
                onClick={() => router.push('/character-selection')}
              >
                Start Your Retro Adventure
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='w-full sm:w-1/2 flex justify-center items-center'
            >
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                <Image
                  src="/assets/img/multiversx-white.svg"
                  alt="MultiversX Logo"
                  layout="fill"
                  objectFit="contain"
                  className="opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-orange-500/30 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          </div>

          <motion.footer
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className='mt-12 text-sm text-gray-500'
          >
            Powered by{' '}
            <a
              href='#'
              target='_blank'
              rel="noopener noreferrer"
              className='text-blue-400 hover:text-blue-300 transition-colors'
            >
              QuantumX Network
            </a>
          </motion.footer>
        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
}