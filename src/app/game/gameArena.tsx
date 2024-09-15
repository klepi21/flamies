'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { Alert, AlertDescription, AlertTitle } from "../../ui/Alert"
import { Button } from "../../ui/Button"
import { Droplet, Cloud, Skull, Zap, Battery, Heart, Skull as SkullIcon, Infinity, Volume2, Brain } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

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
  { name: 'Sound', emoji: '🔊', icon: Volume2 },
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
  attributes: Record<string, string | number>;
  image_url: string;
}

interface Particle {
  id: string;
  style: React.CSSProperties;
  emoji: string;
}

export default function GameArena({ identifier, enemyIdentifier }: GameArenaProps) {
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
  const [gameOver, setGameOver] = useState(false)
  const [playerWon, setPlayerWon] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [enemyData, setEnemyData] = useState<EnemyData | null>(null)
  const [currentTurn, setCurrentTurn] = useState<'player' | 'enemy' | null>(null);
  const [healCooldown, setHealCooldown] = useState(3);
  const [turnCount, setTurnCount] = useState(0);

  const fetchPlayerData = async (retryCount = 0) => {
    try {
      const docRef = doc(db, "flamies", identifier);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Raw player data:", data);

        interface Attribute {
          trait_type: string;
          value: string | number;
        }

        const attributes = data.attributes.reduce((acc: Record<string, string | number>, attr: Attribute) => {
          acc[attr.trait_type] = attr.value;
          return acc;
        }, {});

        const processedData: PlayerData = {
          identifier: data.identifier,
          image_url: data.image_url,
          attributes: attributes
        };

        setPlayerData(processedData);
        setPlayerHealth(Number(processedData.attributes.HP));
        console.log("Processed player attributes:", processedData.attributes);
      } else {
        console.log("No such document!");
        const fallbackData = getFallbackPlayerData();
        setPlayerData(fallbackData);
        setPlayerHealth(fallbackData.attributes.HP);
      }
    } catch (error) {
      console.error("Error fetching player data:", error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
        setTimeout(() => fetchPlayerData(retryCount + 1), RETRY_DELAY);
      } else {
        console.error("Max retries reached. Using fallback data.");
        const fallbackData = getFallbackPlayerData();
        setPlayerData(fallbackData);
        setPlayerHealth(fallbackData.attributes.HP);
      }
    }
  };

  const fetchEnemyData = async (retryCount = 0) => {
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
          identifier: data.identifier || enemyIdentifier,
          image_url: data.image_url || "https://via.placeholder.com/140",
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
  };

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
    const baseDamagePercentage = 0.10;
    let baseDamage = defenderMaxHP * baseDamagePercentage;
    baseDamage = baseDamage * (attackerAttack / defenderDefence);
    const randomFactor = Math.random() * 0.2 + 0.9;
    let damage = Math.floor(baseDamage * randomFactor);
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }
    return Math.max(1, damage);
  }, [])

  const calculateDodgeChance = useCallback((attackerSpeed: number, defenderSpeed: number) => {
    const speedDifference = defenderSpeed - attackerSpeed;
    const baseDodgeChance = 0.05;
    const dodgeChance = Math.min(baseDodgeChance + (speedDifference / 200), 0.25);
    return Math.max(dodgeChance, 0);
  }, [])

  const attack = useCallback((isPlayer: boolean, attackType: { name: string }) => {
    if (gameOver) return;

    const attacker = isPlayer ? playerData : enemyData;
    const defender = isPlayer ? enemyData : playerData;

    if (!attacker || !defender) return;

    const dodgeChance = calculateDodgeChance(attacker.attributes.Speed, defender.attributes.Speed);
    const isDodged = Math.random() < dodgeChance;

    if (isDodged) {
      const message = `${defender.identifier} dodged!`;
      setBattleLog((prev) => [...prev, message]);
      if (isPlayer) {
        setLastDamageDealt(0);
      } else {
        setLastDamageReceived(0);
      }
    } else {
      const isCritical = Math.random() < 0.1;
      const damage = calculateDamage(
        attacker.attributes.Attack, 
        defender.attributes.Defence, 
        defender.attributes.HP,
        isCritical
      );

      const message = `${attacker.identifier} ${attackType.name}: ${damage}${isCritical ? '!' : ''}`;
      setBattleLog((prev) => [...prev, message]);

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
    }, 1000)
  }, [gameOver, calculateDamage, createParticles, playerData, enemyData, calculateDodgeChance])

  const playerAttack = useCallback((attackType: { name: string }) => {
    console.log("Player attacking with:", attackType);
    if (currentTurn !== 'player' || gameOver) return
    attack(true, attackType)
  }, [currentTurn, gameOver, attack])

  useEffect(() => {
    if (currentTurn === 'enemy' && !gameOver) {
      const enemyAttackTimeout = setTimeout(() => {
        const enemyAttackType = enemyAttackTypes[Math.floor(Math.random() * enemyAttackTypes.length)]
        attack(false, enemyAttackType)
      }, 1500)

      return () => clearTimeout(enemyAttackTimeout)
    }
  }, [currentTurn, gameOver, attack, enemyAttackTypes])

  const endGame = (playerWon: boolean) => {
    setGameOver(true)
    setPlayerWon(playerWon)
    setShowAlert(true)
    setBattleLog((prev) => [...prev, playerWon ? "You won the battle!" : "You lost the battle!"])
  }

  const heal = () => {
    if (playerData && currentTurn === 'player' && !gameOver && healCooldown === 0 && turnCount >= 3) {
      const healAmount = Math.floor(Number(playerData.attributes.HP) * 0.3);
      const newHealth = Math.min(playerHealth + healAmount, Number(playerData.attributes.HP));
      setPlayerHealth(newHealth);
      setHealCooldown(3);
      setBattleLog((prev) => [...prev, `${playerData.identifier} healed for ${healAmount}`]);
      setCurrentTurn('enemy');
    }
  };

  useEffect(() => {
    if (currentTurn === 'player') {
      setTurnCount((prev) => prev + 1);
      if (healCooldown > 0) {
        setHealCooldown((prev) => prev - 1);
      }
    }
  }, [currentTurn, healCooldown]);

  if (!playerData || !enemyData) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
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
        
        {/* Main GameBoy screen */}
        <div className="relative w-full h-[320px] bg-transparent overflow-hidden rounded-lg mb-4 border-4 border-red-800">
          <div className="absolute inset-0">
            <Image
              src="https://i.imgur.com/9Ks8fzV.png"
              alt="Battle Background"
              layout="fill"
              objectFit="fill"
              className="max-w-[137%] h-auto"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
            <div className="w-full flex justify-between items-end mb-4">
              <div className="bg-white bg-opacity-80 rounded-lg p-2 w-40 z-10">
                <h3 className="text-sm font-bold mb-1 text-black">{enemyData.identifier}</h3>
                <div className="h-3 w-full bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300 ease-out"
                    style={{ width: `${(Number(enemyHealth) / Number(enemyData.attributes.HP)) * 100}%` }}
                  />
                </div>
                <p className="text-xs mt-1 text-black">{enemyHealth}/{enemyData.attributes.HP} HP</p>
              </div>
              <div className={`relative z-10 ${enemyAttacking ? 'animate-attack-left' : ''} ${enemyTakingDamage ? 'animate-damage' : ''} ${enemyHealth <= 0 ? 'opacity-50' : ''}`}>
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
                  width={140}
                  height={140}
                  className="drop-shadow-[0_0_15px_rgba(255,255,255,0.9)] brightness-125 contrast-110"
                  unoptimized
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {playerParticles.map((particle) => (
                  <Particle key={particle.id} style={particle.style} emoji={particle.emoji} />
                ))}
              </div>
              <div className="bg-white bg-opacity-80 rounded-lg p-2 w-40 z-10">
                <h3 className="text-sm font-bold mb-1 text-black">{playerData.identifier}</h3>
                <div className="h-3 w-full bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${(playerHealth / playerData.attributes.HP) * 100}%` }}
                  />
                </div>
                <p className="text-xs mt-1 text-black">{playerHealth}/{playerData.attributes.HP} HP</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Second screen (smaller) with integrated battle log and turn indicator */}
        <div className="relative w-full h-[80px] bg-white overflow-hidden rounded-lg mb-4 border-2 border-red-800">
          <div className="absolute inset-0">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ground1-I91WViPvBHLhiYnjEHd3fr66waAoso.webp"
              alt="Second Screen Background"
              layout="fill"
              objectFit="cover"
              className="max-w-[137%] h-auto"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
          <div className="absolute inset-0 bg-white bg-opacity-80 p-2 flex">
            <div className="w-2/3 pr-2 border-r border-gray-300">
              <div className="text-xs font-bold mb-1 text-black">Battle Log:</div>
              <div className="h-[52px] overflow-y-auto text-xs text-black flex flex-col-reverse">
                {battleLog.slice(-4).reverse().map((log, index) => (
                  <p key={`log-${index}`} className="leading-tight">{log}</p>
                ))}
              </div>
            </div>
            <div className="w-1/3 pl-2 flex flex-col justify-between">
              <div className="text-xs text-black">
                <p>Last Atk: {lastAttackType || 'N/A'}</p>
                <p>Dmg Dealt: {lastDamageDealt}</p>
                <p>Dmg Recv: {lastDamageReceived}</p>
              </div>
              {!gameOver && (
                <div className="text-center text-sm font-bold text-black">
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
                  disabled={currentTurn !== 'player' || gameOver}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 mb-1 sm:mb-2"
                >
                  <attack.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  <span className="sr-only">{attack.name} attack</span>
                </Button>
                <span className="text-[10px] sm:text-xs text-white font-medium text-center w-full">{attack.name}</span>
              </div>
            ))}
            <div className="flex flex-col items-center w-12 sm:w-16">
              <Button
                onClick={heal}
                disabled={currentTurn !== 'player' || gameOver || healCooldown > 0 || turnCount < 3}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 mb-1 sm:mb-2"
              >
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                <span className="sr-only">Heal</span>
              </Button>
              <span className="text-[10px] sm:text-xs text-white font-medium text-center w-full">
                {turnCount < 3 ? 'Heal (Locked)' : healCooldown > 0 ? `Heal (${healCooldown})` : 'Heal'}
              </span>
            </div>
          </div>
        </div>

        {/* Start and Select buttons */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
          <Button
            className="w-16 h-8 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-full transform rotate-[-20deg] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            SELECT
          </Button>
          <Button
            className="w-16 h-8 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded-full transform rotate-[-20deg] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
          >
            START
          </Button>
        </div>

        {/* QuantumX Network branding */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-10">
          <p className="text-white text-lg font-bold tracking-wide">QuantumX Network</p>
        </div>
      </div>

      {showAlert && (
        <Alert className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 z-50">
          <AlertTitle>{playerWon ? 'Victory!' : 'Defeat!'}</AlertTitle>
          <AlertDescription>
            <p>{playerWon ? 'You won the battle!' : 'You lost the battle!'}</p>
            <p>Total Damage Dealt: {totalDamageDealt}</p>
            <p>Total Damage Received: {totalDamageReceived}</p>
            <p>Accuracy: {((totalDamageDealt / (totalDamageDealt + totalDamageReceived)) * 100).toFixed(2)}%</p>
            <p>Turns: {battleLog.length}</p>
            <Button onClick={() => setShowAlert(false)} className="mt-4">
              Close
            </Button>
          </AlertDescription>
        </Alert>
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
      `}</style>
    </div>
  )
}