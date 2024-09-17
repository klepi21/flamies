'use client'

import { useState, useEffect } from 'react';
import { AuthRedirectWrapper } from '@/wrappers';
import { ClientHooks } from '@/components/ClientHooks';
import CharacterSelection from './choose';
import MyProfile from './MyProfile';
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, Users } from 'lucide-react';

interface PlayerData {
  account: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  lastChoosenTimeStamp: number | null;
  gamesPlayedToday: number;
  XP: number;
}

export default function Dashboard() {
  const { address } = useGetAccountInfo();
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('character-selection');

  useEffect(() => {
    const initializePlayerData = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const playerRef = doc(db, 'players', address);
      
      try {
        const playerDoc = await getDoc(playerRef);

        if (playerDoc.exists()) {
          setPlayerData(playerDoc.data() as PlayerData);
        } else {
          const newPlayerData: PlayerData = {
            account: address,
            wins: 0,
            losses: 0,
            gamesPlayed: 0,
            lastChoosenTimeStamp: null,
            gamesPlayedToday: 0,
            XP: 0
          };

          await setDoc(playerRef, newPlayerData);
          setPlayerData(newPlayerData);
        }
      } catch (error) {
        console.error("Error initializing player data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePlayerData();
  }, [address]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <>
      <ClientHooks />
      <AuthRedirectWrapper>
        <div className='flex flex-col gap-6 max-w-4xl w-full mx-auto p-4 bg-gray-900 min-h-screen'>
          <div className="w-full">
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveTab('character-selection')}
                className={`flex-1 py-4 px-6 text-lg font-semibold rounded-t-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'character-selection'
                    ? 'bg-cyan-500 text-gray-900'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Users className="mr-2" size={24} />
                Character Selection
              </button>
              <button
                onClick={() => setActiveTab('my-profile')}
                className={`flex-1 py-4 px-6 text-lg font-semibold rounded-t-lg flex items-center justify-center transition-all duration-300 ${
                  activeTab === 'my-profile'
                    ? 'bg-cyan-500 text-gray-900'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <User className="mr-2" size={24} />
                My Profile
              </button>
            </div>
            <div className="bg-gray-800 p-6 rounded-b-lg shadow-lg">
              {activeTab === 'character-selection' ? (
                <CharacterSelection />
              ) : (
                <MyProfile playerData={playerData} />
              )}
            </div>
          </div>
        </div>
      </AuthRedirectWrapper>
    </>
  );
}