/* eslint-disable */

'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Button } from "../../ui/Button"
import { Droplet, Cloud, Skull, Zap, Battery, Heart, Skull as SkullIcon, Infinity, Volume2, Brain } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, increment, updateDoc, query, where, getDocs, collection } from 'firebase/firestore'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui/Dialog"
import { ScrollArea } from "@/ui/ScrollArea"
import { X } from 'lucide-react'
import { useGetAccountInfo } from '@multiversx/sdk-dapp/hooks'

// Initialize Firebase (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyCIqpE3Z6C_2td5b1hGgQLyEDIIf8RySHw",
  authDomain: "flamies-fa7bb.firebaseapp.com",
  projectId: "flamies-fa7bb",
  storageBucket: "flamies-fa7bb.appspot.com",
  messagingSenderId: "672027851197",
  appId: "1:672027851197:web:aa6d834c8490df3e38bad4",
  measurementId: "G-NFWGG37ESJ"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const ALL_ATTACK_TYPES = [
  { name: 'Acid', emoji: '🧪', icon: Droplet },
  { name: 'Darkness', emoji: '🌑', icon: Cloud },
  { name: 'Disease Creation and Control', emoji: '🦠', icon: Skull },
  { name: 'Elemental', emoji: '🌪️', icon: Zap },
  { name: 'Energy Drain', emoji: '🔋', icon: Battery },
  { name: 'Life Drain', emoji: '💔', icon: Heart },
  { name: 'Necromancy', emoji: '💀', icon: SkullIcon },
  { name: 'Reality Warp', emoji: '🌀', icon: Infinity },
  { name: 'Sound', emoji: '', icon: Volume2 },
  { name: 'Telepathy', emoji: '🧠', icon: Brain },
]

interface ParticleProps {
  style: React.CSSProperties;
  emoji: string;
}

const Particle: React.FC<ParticleProps> = ({ style, emoji }) => (
  <div className="absolute animate-particle" style={style}>{emoji}</div>
)

interface GameArenaProps {
  identifier: string;
  enemyIdentifier: string;
}

const getAttackType = (superPower: string) => {
  return ALL_ATTACK_TYPES.find(a => a.name.toLowerCase() === superPower.toLowerCase()) || 
    { name: superPower, emoji: '❓', icon: Zap };
}

interface EnemyData {
  identifier: string;
  attributes: Record<string, string | number>;
  image_url: string;
}

interface PlayerData {
  identifier: string;
  attributes: Record<string, any>;
  image_url: string;
}

interface Particle {
  id: string;
  style: React.CSSProperties;
  emoji: string;
}

interface BattleLogEntry {
  attacker: string;
  attack: string;
  damage: number;
}

export default function GameArena({ identifier, enemyIdentifier }: GameArenaProps) {
  const { address: connectedUserAddress } = useGetAccountInfo(); // Use the address from the hook
  const [showWarningDialog, setShowWarningDialog] = useState(false); // State for the warning dialog
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const [canPlay, setCanPlay] = useState(true);

  const [gameOver, setGameOver] = useState(false); // Declare gameOver state first
  const [playerHealth, setPlayerHealth] = useState(0)
  const [enemyHealth, setEnemyHealth] = useState(0)
  const [playerAttacking, setPlayerAttacking] = useState(false)
  const [enemyAttacking, setEnemyAttacking] = useState(false)
  const [playerTakingDamage, setPlayerTakingDamage] = useState(false)
  const [enemyTakingDamage, setEnemyTakingDamage] = useState(false)
  const [playerParticles, setPlayerParticles] = useState<Particle[]>([])
  const [enemyParticles, setEnemyParticles] = useState<Particle[]>([])
  const [lastAttackType, setLastAttackType] = useState('')
  const [lastDamageDealt, setLastDamageDealt] = useState(0)
  const [lastDamageReceived, setLastDamageReceived] = useState(0)
  const [totalDamageDealt, setTotalDamageDealt] = useState(0)
  const [totalDamageReceived, setTotalDamageReceived] = useState(0)
  const [playerWon, setPlayerWon] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [enemyData, setEnemyData] = useState<EnemyData | null>(null)
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy' | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);

  const gameEndedRef = useRef(false); // Create a ref to track if the game has ended

  // Function to update player stats at the end of the game
  const updatePlayerStats = useCallback(async (outcome: 'win' | 'loss') => {
    if (!connectedUserAddress) {
      console.error("Connected user address is not defined.");
      return;
    }

    const docRef = doc(db, "players", connectedUserAddress);

    try {
      const updates: any = {
        
      };

      if (outcome === 'win') {
        updates.wins = increment(1);
        updates.XP = increment(50);
        updates.losses = increment(-1);
      } else {
        
        updates.XP = increment(30);
      }

      await updateDoc(docRef, updates);
      console.log("Player stats updated successfully based on game outcome:", updates);
    } catch (error) {
      console.error("Error updating player stats:", error);
    }
  }, [connectedUserAddress]);

  // Function to end the game and update stats
  const endGame = useCallback((playerWon: boolean) => {
    if (gameOver || gameEndedRef.current) return; // Prevent multiple calls
    gameEndedRef.current = true; // Set the ref to true to indicate the game has ended
    setGameOver(true);
    setPlayerWon(playerWon);
    updatePlayerStats(playerWon ? 'win' : 'loss');
    setShowEndGameDialog(true);
    console.log("Game ended, updating stats for:", playerWon ? 'win' : 'loss');
  }, [updatePlayerStats, gameOver]);

  const fetchPlayerData = useCallback(async (retryCount = 0) => {
    try {
      const playersRef = collection(db, "players");
      const q = query(playersRef, where("account", "==", connectedUserAddress)); // Use connectedUserAddress in the query

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const playerDoc = querySnapshot.docs[0].data(); // Get the first matching document
        const playerIdentifier = playerDoc.ChoosedNFT; // Use ChoosedNFT instead of identifier

        console.log("Raw player data:", playerDoc);

        // Check gamesPlayedToday
        if (playerDoc.gamesPlayedToday > 40) {
          setCanPlay(false);
          return;
        }

        // Ensure playerIdentifier is defined before proceeding
        if (!playerIdentifier) {
          console.error("Player identifier is undefined.");
          return;
        }

        // Now fetch the player data using the ChoosedNFT as the identifier
        const playerDocRef = doc(db, "flamies", playerIdentifier); // Use ChoosedNFT to fetch from flamies collection
        const playerDocSnap = await getDoc(playerDocRef);

        if (playerDocSnap.exists()) {
          const playerDataFromFlamies = playerDocSnap.data();
          console.log("Raw player data from flamies:", playerDataFromFlamies);

          // Ensure attributes are correctly structured
          if (playerDataFromFlamies.attributes) { // Check playerDataFromFlamies for attributes
            // Define the Attribute interface here
            interface Attribute {
              trait_type: string;
              value: string | number;
            }
            const attributes = playerDataFromFlamies.attributes.reduce((acc: Record<string, string | number>, attr: Attribute) => {
              acc[attr.trait_type] = attr.value;
              return acc;
            }, {});

            const processedData: PlayerData = {
              identifier: playerIdentifier,
              image_url: playerDataFromFlamies.image_url,
              attributes: attributes
            };

            setPlayerData(processedData);
            setPlayerHealth(Number(processedData.attributes.HP));
            console.log("Processed player attributes:", processedData.attributes);
          } else {
            console.error("Attributes not found in player data from flamies.");
          }
        } else {
          console.log("No such document in flamies collection for player data!");
        }
      } else {
        console.log("No such document in players collection!");
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
    }
  }, [connectedUserAddress]);

  const fetchEnemyData = useCallback(async (retryCount = 0) => {
    try {
      const docRef = doc(db, "flamies", enemyIdentifier);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Raw enemy data:", data);

        interface Attribute {
          trait_type: string;
          value: string | number;
        }

        const attributes = data.attributes.reduce((acc: Record<string, string | number>, attr: Attribute) => {
          acc[attr.trait_type] = attr.value;
          return acc;
        }, {});

        const processedData: EnemyData = {
          identifier: data.identifier || enemyIdentifier, // Use the enemyIdentifier if data.identifier is not available
          image_url: data.image_url || "https://via.placeholder.com/140", // Use a placeholder if image_url is not available
          attributes: attributes
        };

        setEnemyData(processedData);
        setEnemyHealth(Number(processedData.attributes.HP));
        console.log("Processed enemy attributes:", processedData.attributes);
      } else {
        console.log("No such document for enemy!");
        const fallbackData = getFallbackEnemyData();
        setEnemyData(fallbackData);
        setEnemyHealth(Number(fallbackData.attributes.HP));
      }
    } catch (error) {
      console.error("Error fetching enemy data:", error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying enemy data fetch... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(() => fetchEnemyData(retryCount + 1), RETRY_DELAY);
      } else {
        console.error("Max retries reached for enemy data. Using fallback data.");
        const fallbackData = getFallbackEnemyData();
        setEnemyData(fallbackData);
        setEnemyHealth(Number(fallbackData.attributes.HP));
      }
    }
  }, [enemyIdentifier]);

  useEffect(() => {
    fetchPlayerData();
    fetchEnemyData();
  }, [identifier, enemyIdentifier, fetchPlayerData, fetchEnemyData]);

  useEffect(() => {
    if (playerData && enemyData) {
      const playerSpeed = playerData.attributes.Speed;
      const enemySpeed = enemyData.attributes.Speed;
      console.log("Player Speed:", playerSpeed);
      console.log("Enemy Speed:", enemySpeed);

      if (playerSpeed >= enemySpeed) {
        setCurrentTurn('player');
        console.log("First turn: player");
      } else {
        setCurrentTurn('enemy');
        console.log("First turn: enemy");
      }
    }
  }, [playerData, enemyData]);

  const getFallbackPlayerData = () => ({
    identifier: "DefaultPlayer",
    image_url: "https://via.placeholder.com/140",
    attributes: {
      HP: 100,
      Attack: 50,
      Speed: 50,
      Defence: 50,
      "Super Power#1": "Fire",
      "Super Power#2": "Ice"
    }
  })

  const getFallbackEnemyData = (): EnemyData => ({
    identifier: "DefaultEnemy",
    image_url: "https://via.placeholder.com/140",
    attributes: {
      HP: 100,
      Attack: 50,
      Speed: 50,
      Defence: 50,
      "Super Power#1": "Dark",
      "Super Power#2": "Lightning"
    }
  })

  const playerAttackTypes = useMemo(() => {
    if (playerData) {
      return [
        getAttackType(playerData.attributes["Super Power#1"]),
        getAttackType(playerData.attributes["Super Power#2"])
      ]
    }
    return []
  }, [playerData])

  const enemyAttackTypes = useMemo(() => {
    if (enemyData) {
      return [
        getAttackType(String(enemyData.attributes["Super Power#1"])),
        getAttackType(String(enemyData.attributes["Super Power#2"]))
      ]
    }
    return []
  }, [enemyData])

  const createParticles = useCallback((attackType: string) => {
    const particles = []
    const attack = ALL_ATTACK_TYPES.find(a => a.name.toLowerCase() === attackType.toLowerCase()) || 
      playerAttackTypes.find(a => a.name.toLowerCase() === attackType.toLowerCase()) ||
      enemyAttackTypes.find(a => a.name.toLowerCase() === attackType.toLowerCase()) ||
      { name: attackType, emoji: '❓' }
    const emoji = attack.emoji
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: `${Date.now()}-${i}`,
        style: {
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 0.5}s`,
          fontSize: `${Math.random() * 1.5 + 0.5}rem`,
          transform: `rotate(${Math.random() * 360}deg)`,
        },
        emoji: emoji,
      })
    }
    return particles
  }, [playerAttackTypes, enemyAttackTypes])

  const calculateDamage = useCallback((
    attackerAttack: number,
    defenderDefence: number,
    defenderMaxHP: number,
    isCritical: boolean = false
  ) => {
    // Base damage percentage (e.g., 10% of max HP)
    const baseDamagePercentage = 0.10;
    
    // Calculate base damage as a percentage of defender's max HP
    let baseDamage = defenderMaxHP * baseDamagePercentage;
    
    // Apply attacker's attack and defender's defence
    baseDamage = baseDamage * (attackerAttack / defenderDefence);
    
    // Apply a random factor for variability (0.9 to 1.1)
    const randomFactor = Math.random() * 0.2 + 0.9;
    let damage = Math.floor(baseDamage * randomFactor);
    
    // Apply critical hit
    if (isCritical) {
      damage = Math.floor(damage * 1.5); // 50% extra damage for critical hits
    }
    
    // Ensure minimum damage of 1
    return Math.max(1, damage);
  }, [])

  const calculateDodgeChance = useCallback((attackerSpeed: number, defenderSpeed: number) => {
    const speedDifference = defenderSpeed - attackerSpeed;
    const baseDodgeChance = 0.05; // 5% base dodge chance
    const dodgeChance = Math.min(baseDodgeChance + (speedDifference / 200), 0.25); // Max 25% dodge chance
    return Math.max(dodgeChance, 0); // Ensure dodge chance is not negative
  }, [])

  const attack = useCallback((isPlayer: boolean, attackType: { name: string }) => {
    if (gameOver || isActionInProgress) return;

    setIsActionInProgress(true);

    const attacker = isPlayer ? playerData : enemyData;
    const defender = isPlayer ? enemyData : playerData;

    if (!attacker || !defender) return;

    const dodgeChance = calculateDodgeChance(attacker.attributes.Speed, defender.attributes.Speed);
    const isDodged = Math.random() < dodgeChance;

    if (isDodged) {
      const message = `${defender.identifier} dodged!`;
      setBattleLog((prev) => [...prev, { attacker: defender.identifier, attack: 'Dodge', damage: 0 }]);
      if (isPlayer) {
        setLastDamageDealt(0);
      } else {
        setLastDamageReceived(0);
      }
    } else {
      const isCritical = Math.random() < 0.1; // 10% chance for a critical hit
      const damage = calculateDamage(
        attacker.attributes.Attack, 
        defender.attributes.Defence, 
        defender.attributes.HP, // Pass the defender's max HP
        isCritical
      );

      const message = `${attacker.identifier} ${attackType.name}: ${damage}${isCritical ? '!' : ''}`;
      setBattleLog((prev) => [...prev, { attacker: attacker.identifier, attack: attackType.name, damage }]);

      if (isPlayer) {
        setPlayerAttacking(true)
        setEnemyTakingDamage(true)
        setEnemyHealth((prev) => {
          const newHealth = Math.max(prev - damage, 0)
          if (newHealth === 0) endGame(true)
          return newHealth
        })
        setPlayerParticles(createParticles(attackType.name))
        setEnemyParticles(createParticles(attackType.name))
        setLastAttackType(attackType.name)
        setLastDamageDealt(damage)
        setTotalDamageDealt((prev) => prev + damage)
      } else {
        setEnemyAttacking(true)
        setPlayerTakingDamage(true)
        setPlayerHealth((prev) => {
          const newHealth = Math.max(prev - damage, 0)
          if (newHealth === 0) endGame(false)
          return newHealth
        })
        setEnemyParticles(createParticles(attackType.name))
        setPlayerParticles(createParticles(attackType.name))
        setLastAttackType(attackType.name)
        setLastDamageReceived(damage)
        setTotalDamageReceived((prev) => prev + damage)
      }
    }

    setTimeout(() => {
      if (isPlayer) {
        setPlayerAttacking(false)
        setEnemyTakingDamage(false)
      } else {
        setEnemyAttacking(false)
        setPlayerTakingDamage(false)
      }
      setPlayerParticles([])
      setEnemyParticles([])
      if (!gameOver) {
        setCurrentTurn(isPlayer ? 'enemy' : 'player')
      }
      setIsActionInProgress(false);
    }, 1000)
  }, [gameOver, calculateDamage, createParticles, playerData, enemyData, calculateDodgeChance, isActionInProgress, endGame])

  const playerAttack = useCallback((attackType: { name: string }) => {
    console.log("Player attacking with:", attackType);
    if (currentTurn !== 'player' || gameOver || isActionInProgress) return
    attack(true, attackType)
  }, [currentTurn, gameOver, attack, isActionInProgress])

  useEffect(() => {
    if (currentTurn === 'enemy' && !gameOver && !isActionInProgress) {
      const enemyAttackTimeout = setTimeout(() => {
        const enemyAttackType = enemyAttackTypes[Math.floor(Math.random() * enemyAttackTypes.length)]
        attack(false, enemyAttackType)
      }, 1500)

      return () => clearTimeout(enemyAttackTimeout)
    }
  }, [currentTurn, gameOver, attack, enemyAttackTypes, isActionInProgress]);


  useEffect(() => {
    if (currentTurn === 'player') {
      setTurnCount((prev) => prev + 1);
    }
  }, [currentTurn]);

  const toggleBattleLog = useCallback(() => {
    setShowBattleLog(prev => !prev);
  }, []);

  const handleSelectButtonClick = () => {
    setShowWarningDialog(true);
  };

  if (!canPlay) {
    return <div>You cannot play more matches today. Please come back tomorrow.</div>;
  }

  if (!playerData || !enemyData) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-2 border-cyan-500 text-white p-4">
          <DialogHeader className="bg-gradient-to-r from-red-900 to-red-950 p-4 relative">
            <DialogTitle className="text-2xl font-bold text-cyan-400">Warning</DialogTitle>
            <button
              onClick={() => setShowWarningDialog(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              X
            </button>
          </DialogHeader>
          <DialogDescription className="text-gray-300">
            If you refresh or close the browser you will get a Loss and a Decrease on your XP.
          </DialogDescription>
        </DialogContent>
      </Dialog>

      

      <div className="relative w-full max-w-[480px] h-[720px] bg-gradient-to-b from-red-900 to-red-950 rounded-[45px] p-8 shadow-xl overflow-hidden">
        {/* Fiery pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-8 h-8 bg-orange-400 rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `flicker ${Math.random() * 3 + 2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
        

         {/* Return to Dashboard button */}
         {gameOver && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 ">
                    <Button
                        onClick={() => window.location.href = '/dashboard'}
                        className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                    >
                        Return to Dashboard
                    </Button>
                </div>
            )}

            
        {/* Main GameBoy screen */}
        <div className="relative w-full h-[320px] bg-transparent overflow-hidden rounded-lg mb-4 border-4 border-red-800">
          <div className="absolute inset-0">
            <Image
              src="https://i.ibb.co/qgFFsrF/2024-09-20-18-04-29-copy.png"
              alt="Battle Background"
              layout="fill"
              objectFit="fill"
              className="max-w-[140%] h-auto"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
            <div className="w-full flex justify-between items-end mb-4">
            <div className="relative bg-white bg-opacity-60 rounded-lg p-2 w-48 z-10 -mt-22">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-3 h-6 bg-white bg-opacity-30 border-t border-b border-l border-gray-300 clip-arrow-right"></div>
                <h3 className="text-sm font-bold mb-1 text-black">{'Enemy'}</h3>
                {/* <h3 className="text-sm font-bold mb-1 text-black">{enemyData.identifier || 'Enemy'}</h3> */}
                <div className="h-3 w-full bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${(Number(enemyHealth) / Number(enemyData.attributes.HP)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-black">{enemyHealth}/{enemyData.attributes.HP} HP</p>
                  <p className="text-xs text-black">{Math.round((Number(enemyHealth) / Number(enemyData.attributes.HP)) * 100)}%</p>
                </div>
              </div>
              <div className={`relative z-10 ${enemyAttacking ? 'animate-attack-left' : ''} ${enemyTakingDamage ? 'animate-damage' : ''} ${enemyHealth <= 0 ? 'opacity-50' : ''} transform translate-x-[-10px] translate-y-[40px]`}>
                <Image
                  src={enemyData.image_url}
                  alt={enemyData.identifier}
                  width={140}
                  height={140}
                  className="drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] brightness-125 contrast-110"
                  unoptimized
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {enemyParticles.map((particle) => (
                  <Particle key={particle.id} style={particle.style} emoji={particle.emoji} />
                ))}
              </div>
            </div>
            <div className="w-full flex justify-between items-start">
              <div className={`relative z-10 ${playerAttacking ? 'animate-attack-right' : ''} ${playerTakingDamage ? 'animate-damage' : ''} ${playerHealth <= 0 ? 'opacity-50' : ''}`}>
                <Image
                  src={playerData.image_url}
                  alt={playerData.identifier}
                  width={160}
                  height={160}
                  className="drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] brightness-125 contrast-110"
                  unoptimized
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {playerParticles.map((particle) => (
                  <Particle key={particle.id} style={particle.style} emoji={particle.emoji} />
                ))}
              </div>
              <div className="relative bg-white bg-opacity-60 rounded-lg p-2 w-48 z-10 mt-16">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-3 h-6 bg-white bg-opacity-30 border-t border-b border-r border-gray-300 clip-arrow"></div>
                <h3 className="text-sm font-bold mb-1 text-black">{'You'}</h3>
                {/* <h3 className="text-sm font-bold mb-1 text-black">{playerData.identifier || 'You'}</h3> */}
                <div className="h-3 w-full bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${(playerHealth / playerData.attributes.HP) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-black">{playerHealth}/{playerData.attributes.HP} HP</p>
                  <p className="text-xs text-black">{Math.round((playerHealth / playerData.attributes.HP) * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second screen (smaller) with integrated battle log and turn indicator */}
        <div className="relative w-full h-[80px] bg-gray-900 overflow-hidden rounded-lg mb-4 border-2 border-red-800">
          <div className="absolute inset-0 bg-opacity-80 p-2 flex">
            <div className="w-2/3 pr-2 border-r border-gray-700">
              <div className="text-xs font-bold mb-1 text-cyan-400">Battle Log:</div>
              <div className="h-[52px] overflow-y-auto text-xs text-white flex flex-col-reverse">
                {battleLog.slice(-4).reverse().map((log, index) => (
                  <p key={`log-${index}`} className="leading-tight">
                    <span className="font-bold text-cyan-400">{log.attacker}</span>
                    <span className="text-gray-300"> used </span>
                    <span className="font-bold text-yellow-400">{log.attack}</span>
                    <span className="text-gray-300"> for </span>
                    <span className="font-bold text-red-400">{log.damage}</span>
                    <span className="text-gray-300"> damage</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="w-1/3 pl-2 flex flex-col justify-between">
              <div className="text-xs text-white">
                <p>Last Atk: {lastAttackType || 'N/A'}</p>
                <p>Dmg Dealt: {lastDamageDealt}</p>
                <p>Dmg Recv: {lastDamageReceived}</p>
              </div>
              {!gameOver && (
                <div className="text-center text-sm font-bold text-cyan-400">
                  {currentTurn === 'player' ? "Your Turn" : "Enemy's Turn"}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* GameBoy controls */}
        <div className="flex justify-between items-center mt-4 relative z-20">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-red-950 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-900 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-800 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl">
                  ✛
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 sm:space-x-4">
            {playerAttackTypes.map((attack) => (
              <div key={attack.name} className="flex flex-col items-center w-12 sm:w-16">
                <Button
                  onClick={() => playerAttack(attack)}
                  disabled={currentTurn !== 'player' || gameOver || isActionInProgress}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 mb-1 sm:mb-2"
                >
                  <attack.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  <span className="sr-only">{attack.name} attack</span>
                </Button>
                <span className="text-[10px] sm:text-xs text-white font-medium text-center w-full">{attack.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start and Select buttons */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          <Button
            onClick={handleSelectButtonClick}
            className="w-16 h-8 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-full transform rotate-[-20deg] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            SELECT
          </Button>
          <Button
            onClick={toggleBattleLog}
            className="w-16 h-8 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-full transform rotate-[-20deg] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            START
          </Button>
        </div>

        {/* QuantumX Network branding */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-10">
          <p className="text-white text-md font-bold tracking-wide">QuantumX Network</p>
        </div>
      </div>

      {/* Battle Log Dialog */}
      <Dialog open={showBattleLog} onOpenChange={setShowBattleLog}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-2 border-cyan-500 text-white p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-red-900 to-red-950 p-4 relative">
            <DialogTitle className="text-2xl font-bold text-cyan-400">Battle Log</DialogTitle>
            <button
              onClick={() => setShowBattleLog(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </DialogHeader>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-cyan-300">Full history of the battle</h3>
            <ScrollArea className="h-[50vh] w-full pr-4">
              {battleLog.map((entry, index) => (
                <div key={index} className="mb-3 p-2 bg-gray-800 rounded-lg border border-cyan-700">
                  <p className="text-sm">
                    <span className="font-bold text-cyan-400">{entry.attacker}</span>
                    <span className="text-gray-300"> used </span>
                    <span className="font-bold text-yellow-400">{entry.attack}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-300">Damage dealt: </span>
                    <span className="font-bold text-red-400">{entry.damage}</span>
                  </p>
                </div>
              ))}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
      
      {showEndGameDialog && (
        <Dialog open={showEndGameDialog} onOpenChange={setShowEndGameDialog}>
          <DialogContent className="sm:max-w-[425px] bg-gray-900 border-2 border-cyan-500 text-white p-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-cyan-400">
                {playerWon ? 'Victory!' : 'Defeat!'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-300">
              {playerWon
                ? 'Congratulations! You have won the battle.'
                : 'Better luck next time. You have been defeated.'}
            </p>
            <Button
              onClick={() => setShowEndGameDialog(false)}
              className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              Close
            </Button>
          </DialogContent>
        </Dialog>
      )}
      
      <style jsx global>{`
        @keyframes attack-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(15px); }
        }
        @keyframes attack-left {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-15px); }
        }
        @keyframes damage {
          0%, 100%  { transform: translateX(0); }
          25%, 75% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
        }
        @keyframes particle {
          0% { transform: translate(0, 0) scale(1) rotate(var(--rotation)); opacity: 1; }
          100% { transform: translate(var(--tx, -30px), var(--ty, -30px)) scale(0) rotate(var(--rotation)); opacity: 0; }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        .animate-attack-right {
          animation: attack-right 0.5s ease-in-out;
        }
        .animate-attack-left {
          animation: attack-left 0.5s ease-in-out;
        }
        .animate-damage {
          animation: damage 0.5s ease-in-out;
        }
        .animate-particle {
          --tx: ${Math.random() * 120 - 60}px;
          --ty: ${Math.random() * -120 - 30}px;
          --rotation: ${Math.random() * 360}deg;
          animation: particle 1s ease-out forwards;
        }

        .clip-arrow-right {
          clip-path: polygon(100% 50%, 0% 0%, 0% 100%);
        }

        .clip-arrow {
          clip-path: polygon(0% 50%, 100% 0%, 100% 100%);
        }
      `}</style>
    </div>
  )
}