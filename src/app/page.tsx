'use client';

import { AuthRedirectWrapper, PageWrapper } from '@/wrappers';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Implement the RoadmapItem component
const RoadmapItem = ({ date, title }: { date: string; title: string }) => (
  <div className="flex items-center">
    <div className="flex-shrink-0 w-24 text-sm text-red-400">{date}</div>
    <div className="w-full border-t border-red-700"></div>
    <div className="flex-shrink-0 w-32 text-sm font-medium text-red-300">{title}</div>
  </div>
);

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
        <div className='flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 sm:px-6 lg:px-8'>
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='text-center mb-8 sm:mb-12'
          >
            <h1 className='text-4xl sm:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500'>
              QuantumXFlamies
            </h1>
            <p className='text-sm sm:text-base text-red-300'>
              Where Quantum Meets Fire in a Vintage Turn-Based Adventure
            </p>
          </motion.div>

          <div className='flex flex-col sm:flex-row items-center justify-center w-full max-w-6xl gap-8'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className='w-full sm:w-1/2'
            >
              <h2 className='text-2xl sm:text-3xl font-semibold mb-4 text-red-400'>Welcome to QuantumXFlamies</h2>
              <p className='text-sm sm:text-base text-red-200 mb-6'>
                Embark on a nostalgic journey where quantum mechanics intertwines with fiery creatures. 
                QuantumXFlamies offers a unique gaming experience that combines cutting-edge blockchain technology 
                with the charm of classic turn-based gameplay.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='w-full sm:w-auto bg-gradient-to-r from-red-700 to-red-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 hover:from-red-800 hover:to-red-600'
                onClick={() => router.push('/dashboard')}
              >
                Start Your Fiery Adventure
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 30, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className='w-full sm:w-1/2 flex justify-center items-center mt-8 sm:mt-0'
            >
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80">
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/flamies-fa7bb.appspot.com/o/flamies%2FQXFLM-06e81a-0124.png?alt=media&token=7d55d286-ab80-4d1d-88e0-0ce0081af122"
                  alt="Flamies Logo"
                  layout="fill"
                  objectFit="contain"
                  className="opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 to-orange-500/30 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className='mt-12 w-full max-w-4xl'
          >
            <h3 className='text-2xl font-semibold mb-6 text-red-400 text-center'>Roadmap</h3>
            <div className="space-y-4">
              <RoadmapItem date="Q3 2024" title="Closed Beta" />
              <RoadmapItem date="Q4 2024" title="Open Beta - Single player" />
              <RoadmapItem date="Q1 2025" title="Microupgrades on Single Player" />
              <RoadmapItem date="Q2 2025" title="Upgrade Leveling System" />
              <RoadmapItem date="Q3 2025" title="Start Multiplayer Development" />
              <RoadmapItem date="Q4 2025" title="TBD" />
            </div>
          </motion.div>


        </div>
      </PageWrapper>
    </AuthRedirectWrapper>
  );
}