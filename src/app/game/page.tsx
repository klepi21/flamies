'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { AuthRedirectWrapper } from '@/wrappers'
import { ClientHooks } from '@/components/ClientHooks'
import GameArena from './gameArena'
import { db } from '@/firebase/config'
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks'

const fetchRandomEnemyIdentifier = async (playerIdentifier: string) => {
  try {
    const flamiesRef = collection(db, "flamies");
    const q = query(flamiesRef, where("identifier", "!=", playerIdentifier));
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const enemies = querySnapshot.docs.map(doc => doc.data().identifier);
      const randomIndex = Math.floor(Math.random() * enemies.length);
      return enemies[randomIndex];
    } else {
      console.log("No enemy found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching random enemy:", error);
    return null;
  }
};

const allowedAddresses = [
  'erd1s5ufsgtmzwtp6wrlwtmaqzs24t0p9evmp58p33xmukxwetl8u76sa2p9rv',
  'erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx',
  'erd1qqqqqqqqqqqqqpgqrc4pg2xarca9z34njcxeur622qmfjp8w2jps89fxnl',
  // Add more addresses as needed
];

export default function Game() {
  const searchParams = useSearchParams()
  const identifier = searchParams.get('identifier')
  const [enemyIdentifier, setEnemyIdentifier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { address } = useGetAccountInfo()

  const isAddressAllowed = allowedAddresses.includes(address)

  useEffect(() => {
    const fetchEnemy = async () => {
      if (identifier && isAddressAllowed) {
        setIsLoading(true)
        const enemyId = await fetchRandomEnemyIdentifier(identifier)
        setEnemyIdentifier(enemyId)
        setIsLoading(false)
      }
    }

    fetchEnemy()
  }, [identifier, isAddressAllowed])

  return (
    <>
      <ClientHooks />
      <AuthRedirectWrapper>
        <div className='flex flex-col max-w-3xl w-full'>
          {!isAddressAllowed ? (
            <p className="text-center text-red-500">Sorry, your address is not on the beta list.</p>
          ) : isLoading ? (
            <p>Loading...</p>
          ) : identifier && enemyIdentifier ? (
            <GameArena identifier={identifier} enemyIdentifier={enemyIdentifier} />
          ) : (
            <p>No character selected or no enemy found</p>
          )}
        </div>
      </AuthRedirectWrapper>
    </>
  )
}
