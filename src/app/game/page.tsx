'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { AuthRedirectWrapper } from '@/wrappers'
import { ClientHooks } from '@/components/ClientHooks'
import GameArena from './gameArena'
import { db } from '@/firebase/config'

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

export default function Game() {
  const searchParams = useSearchParams()
  const identifier = searchParams.get('identifier')
  const [enemyIdentifier, setEnemyIdentifier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEnemy = async () => {
      if (identifier) {
        setIsLoading(true)
        const enemyId = await fetchRandomEnemyIdentifier(identifier)
        setEnemyIdentifier(enemyId)
        setIsLoading(false)
      }
    }

    fetchEnemy()
  }, [identifier])

  return (
    <>
      <ClientHooks />
      <AuthRedirectWrapper>
        <div className='flex flex-col max-w-3xl w-full'>
          {isLoading ? (
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
