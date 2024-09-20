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
    'erd1k5uaadyg2dscxer6d63dwzqhrrw9gddve6eg2aaec35x6afdl97s6evfk7',
    'erd15dlzn0sm2hlflyf6sdzyrx47nytq0cxp27032hpdp9xhr9yzrylqcx6h2p',
    'erd17278gc0z9v08a5gszejnug992v02zexr4m6xx0w8tal9p3z6a23q2q2vkx',
    'erd1lzw8h6y4d8ep74d32xeva9wcrxkdtfhdm7rw3exq6ln3s7395t9s4uccfh',
    'erd1muea9hr5wyh7fgdxsermqf9k90hg05483e08q6n7ap8qagw2haysf6807q',
    'erd1yng4ajnxp03lx5erwcq57m5502m6t9nxajf5hv9nw0k27t8zcq4qq3vu4v',
    'erd1lnmfa5p9j6qy40kjtrf0wfq6cl056car6hyvrq5uxdcalc2gu7zsrwalel',
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
