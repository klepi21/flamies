'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Loader2, Heart, Zap, Wind, Shield, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ref, getDownloadURL } from 'firebase/storage'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, updateDoc, increment } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion'
import { useGetAccountInfo } from '@/hooks'

const firebaseConfig = {
  apiKey: "AIzaSyCIqpE3Z6C_2td5b1hGgQLyEDIIf8RySHw",
  authDomain: "flamies-fa7bb.firebaseapp.com",
  projectId: "flamies-fa7bb",
  storageBucket: "flamies-fa7bb.appspot.com",
  messagingSenderId: "672027851197",
  appId: "1:672027851197:web:aa6d834c8490df3e38bad4",
  measurementId: "G-NFWGG37ESJ"
}

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)
const db = getFirestore(app)

interface NFT {
  identifier: string
  imageUrl: string
  attributes: {
    trait_type: string
    value: number | string
  }[]
}

const Firework = ({ x, y }: { x: number; y: number }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i)
  const colors = ['#FF4500', '#FFA500', '#FFD700', '#FF6347', '#FF8C00', '#FF0000', '#FFFF00']

  return (
    <motion.div
      className="absolute"
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 1, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ left: x, top: y }}
    >
      {particles.map((_, index) => (
        <motion.div
          key={index}
          className="absolute w-2 h-2 rounded-full"
          style={{ backgroundColor: colors[index % colors.length] }}
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: [0, (Math.random() - 0.5) * 200],
            y: [0, (Math.random() - 0.5) * 200],
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            times: [0, 0.7, 1],
            delay: Math.random() * 0.2,
          }}
        />
      ))}
    </motion.div>
  )
}

// Update the PlayerData interface
interface Attribute {
  trait_type: string;
  value: number | string;
}

interface PlayerData {
  ChoosedNFT: string;
  lastChoosenTimeStamp: { toMillis: () => number; toDate: () => Date };
  gamesPlayedToday: number;
  attributes?: Attribute[];
}

export default function CharacterSelection() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);

  const [characters, setCharacters] = useState<NFT[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)
  const [fireworks, setFireworks] = useState<{ x: number; y: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [firebaseErrors] = useState<string[]>([])
  const router = useRouter()
  const controls = useAnimation()
  const constraintsRef = useRef<HTMLDivElement>(null)
  const { address } = useGetAccountInfo()
  const [canChooseNFT, setCanChooseNFT] = useState(true)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [hasChosenNFT, setHasChosenNFT] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);


  useEffect(() => {
    const fetchPlayerData = async () => {
      if (address) {
        const playerRef = doc(db, "players", address);
        const playerSnap = await getDoc(playerRef);
        if (playerSnap.exists()) {
          const playerData: PlayerData = playerSnap.data() as PlayerData;
          setPlayerData(playerData);
          // Allow re-selection of NFT
          setHasChosenNFT(false); // Reset to allow choosing again
        } else {
          console.log("No player data found for this address.");
        }
      }
    };

    fetchPlayerData();
  }, [address]);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (hasChosenNFT && playerData && playerData.ChoosedNFT) {
        const url = await getDownloadURL(ref(storage, `flamies/${playerData.ChoosedNFT}.png`))
        setSelectedImageUrl(url)
      }
    }

    fetchImageUrl()
  }, [hasChosenNFT, playerData])

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        const response = await fetch(`https://api.multiversx.com/accounts/${address}/nfts?collection=QXFLM-06e81a`)
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }

        const data = await response.json()
        console.log('Fetched NFT data:', data)

        if (data.length === 0) {
          console.log('No NFTs returned from the API')
          return
        }

        const nftsWithImages = await Promise.all(data.map(async (nft: NFT) => {
          const identifier = nft.identifier
          const imageName = `${identifier}.png`
          const imageRef = ref(storage, `flamies/${imageName}`)
          try {
            console.log(`Processing NFT: ${identifier}`)
            const imageUrl = await getDownloadURL(imageRef)
            console.log(`Got image URL for ${identifier}`)

            const docRef = doc(db, "flamies", identifier)
            const docSnap = await getDoc(docRef)
            console.log(`Got Firestore data for ${identifier}`)

            const attributes = docSnap.exists() ? docSnap.data().attributes : []
            return { identifier, imageUrl, attributes }
          } catch (error) {
            console.error(`Error processing NFT ${identifier}:`, error)
            return null
          }
        }))

        const filteredNFTs = nftsWithImages.filter((nft): nft is NFT => nft !== null)
        console.log('Processed NFTs:', filteredNFTs)

        setCharacters(filteredNFTs)
      } catch (error) {
        console.error('Error in fetchNFTs:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  const triggerFireworks = () => {
    if (constraintsRef.current) {
      const rect = constraintsRef.current.getBoundingClientRect()
      const newFireworks = Array.from({ length: 5 }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
      }))
      setFireworks(newFireworks)
      setTimeout(() => setFireworks([]), 800)
    }
  }

  const nextCharacter = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % characters.length)
    triggerFireworks()
  }

  const prevCharacter = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + characters.length) % characters.length)
    triggerFireworks()
  }

  const handleDragEnd = (event: DragEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      prevCharacter()
    } else if (info.offset.x < -threshold) {
      nextCharacter()
    }
    controls.start({ x: 0 })
  }

  const handleChooseOrPlay = async () => {
    if (isButtonDisabled) return; // Prevent further clicks if the button is disabled
    setIsButtonDisabled(true); // Disable the button

    if (hasChosenNFT) {
      // If an NFT has been chosen, start the game
      const selectedCharacter = characters[currentIndex];
      console.log('Redirecting to game with identifier:', selectedCharacter.identifier);

      // Redirect to the game
      router.push(`/game?identifier=${selectedCharacter.identifier}`);
    } else {
      // If no NFT has been chosen, update the database with the chosen NFT
      const selectedCharacter = characters[currentIndex];
      console.log('Updating database with chosen character:', selectedCharacter.identifier);

      await updateDoc(doc(db, "players", address), {
        lastChoosenTimeStamp: new Date(),
        ChoosedNFT: selectedCharacter.identifier,
      });

      // Set hasChosenNFT to true after choosing
      setHasChosenNFT(true);
    }

    setIsButtonDisabled(false); // Re-enable the button after the operation
  };

  const handlePlay = async () => {
    if (isButtonDisabled) return; // Prevent further clicks if the button is disabled
    setIsButtonDisabled(true); // Disable the button

    console.log('Play button clicked');
    console.log('Current games played today:', playerData?.gamesPlayedToday);

    if (characters.length > 0) {
        console.log('Characters available:', characters.length);

        // Check if games played today is 40
        if (playerData?.gamesPlayedToday !== undefined && playerData.gamesPlayedToday >= 40) {
            console.log('Games played today limit reached.');
            setCanChooseNFT(false);
            return;
        }

        const selectedCharacter = characters[currentIndex];
        console.log('Redirecting to game with identifier:', selectedCharacter.identifier);

        // Update the database before redirecting
        const docRef = doc(db, "players", address);
        const updates = {
            losses: increment(1),
            gamesPlayed: increment(1),
            gamesPlayedToday: increment(1),
            XP: increment(-10)
        };
        await updateDoc(docRef, updates); // Update the database with the new values

        console.log('Fetching updated player data...');
        const playerSnap = await getDoc(docRef);
        if (playerSnap.exists()) {
            const updatedPlayerData: PlayerData = playerSnap.data() as PlayerData;
            setPlayerData(updatedPlayerData);
        }

        // Now redirect to the game
        router.push(`/game?identifier=${selectedCharacter.identifier}`);
    } else {
        console.log('No characters available to play.');
    }
  }

  const confirmChoice = async () => {
    const selectedCharacter = characters[currentIndex]

    await updateDoc(doc(db, "players", address), {
      lastChoosenTimeStamp: new Date(),
      ChoosedNFT: selectedCharacter.identifier,
    })

    router.push(`/game?identifier=${selectedCharacter.identifier}`)
    setShowConfirmationDialog(false)
  }

  const cancelChoice = () => {
    setShowConfirmationDialog(false)
  }

  const getAttributeIcon = (trait_type: string) => {
    switch (trait_type) {
      case 'HP': return <Heart className="w-6 h-6 text-red-500" />
      case 'Attack': return <Zap className="w-6 h-6 text-yellow-500" />
      case 'Speed': return <Wind className="w-6 h-6 text-blue-500" />
      case 'Defence': return <Shield className="w-6 h-6 text-green-500" />
      default: return <Sparkles className="w-6 h-6 text-purple-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Check if the user has no NFTs
  if (error || firebaseErrors.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>No characters available or errors occurred.</p>
      </div>
    )
  }

  // New condition to check if the user has no NFTs
  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>To play this game you need to hold at least one QuantumXFlamie.</p>
        <a href="https://xoxno.com/collection/QXFLM-06e81a" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Get one Now
        </a>
      </div>
    )
  }

  const currentCharacter = characters[currentIndex]

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4"
    >
      <motion.h1 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
        className="text-6xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600"
      >
        {hasChosenNFT ? "Your Chosen Flamie" : "Choose Your Flamie"}
      </motion.h1>

      {hasChosenNFT ? (
        <div className="w-full max-w-4xl bg-gray-800 rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              {selectedImageUrl && (
                <Image
                  src={selectedImageUrl}
                  alt={playerData?.ChoosedNFT ?? 'N/A'}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-lg shadow-lg"
                />
              )}
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold mb-4">Flamie Details</h2>
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 pr-4 font-semibold">NFT ID:</td>
                    <td className="py-2">{playerData?.ChoosedNFT ?? 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 pr-4 font-semibold">Chosen Until:</td>
                    <td className="py-2">{playerData?.lastChoosenTimeStamp?.toDate().toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-gray-700">
                    <td className="py-2 pr-4 font-semibold">Games Played Today:</td>
                    <td className="py-2">{playerData?.gamesPlayedToday || 0}</td>
                  </tr>
                  {playerData?.gamesPlayedToday !== undefined && playerData.gamesPlayedToday >= 40 && (
                    <tr className="border-b border-gray-700">
                      <td className="py-2 pr-4 font-semibold text-red-500" colSpan={2}>
                        You cannot play another game today. You have reached the limit of 40 games.
                      </td>
                    </tr>
                  )}
                  {playerData?.attributes && playerData.attributes.map((attr: Attribute, index: number) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 pr-4 font-semibold">{attr.trait_type}:</td>
                      <td className="py-2">{attr.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {!(playerData?.gamesPlayedToday !== undefined && playerData.gamesPlayedToday >= 40) && (
            <motion.button 
              onClick={handlePlay}
              disabled={isButtonDisabled}
              className={`mt-8 px-12 py-6 text-3xl font-bold text-white rounded-2xl ${
                playerData?.gamesPlayedToday !== undefined && playerData.gamesPlayedToday < 40 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer" 
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              Play
            </motion.button>
          )}
          {playerData?.gamesPlayedToday === 40 && (
            <p className="mt-4 text-red-500">
              You cannot play another game today. You have reached the limit of 40 games.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-8">
            <motion.div 
              ref={constraintsRef}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
              className="relative w-full max-w-md md:max-w-xl aspect-square mb-8 md:mb-0 cursor-grab active:cursor-grabbing overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500 rounded-full opacity-10 blur-2xl"></div>
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  drag="x"
                  dragConstraints={constraintsRef}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  variants={{
                    enter: (direction: number) => ({
                      x: direction > 0 ? 1000 : -1000,
                      opacity: 0,
                      scale: 0.5,
                      rotate: direction > 0 ? 45 : -45,
                    }),
                    center: {
                      zIndex: 1,
                      x: 0,
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                    },
                    exit: (direction: number) => ({
                      zIndex: 0,
                      x: direction < 0 ? 1000 : -1000,
                      opacity: 0,
                      scale: 0.5,
                      rotate: direction < 0 ? 45 : -45,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    rotate: { duration: 0.5 },
                  }}
                  className="absolute inset-0"
                >
                  {currentCharacter && (
                    <Image
                      src={currentCharacter.imageUrl}
                      alt={currentCharacter.identifier}
                      layout="fill"
                      objectFit="contain"
                      className="drop-shadow-2xl scale-100 md:scale-125 lg:scale-150 transition-transform duration-300"
                      draggable="false"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              <motion.div 
                animate={{ 
                  background: [
                    "linear-gradient(0deg, rgba(17, 24, 39, 0.7), transparent)",
                    "linear-gradient(180deg, rgba(17, 24, 39, 0.7), transparent)",
                    "linear-gradient(360deg, rgba(17, 24, 39, 0.7), transparent)",
                  ]
                }}
                transition={{ 
                  duration: 5, 
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="absolute inset-0"
              ></motion.div>
              {fireworks.map((fw, index) => (
                <Firework key={index} x={fw.x} y={fw.y} />
              ))}
            </motion.div>

            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 120 }}
              className="w-full max-w-md bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-4 text-center">Character Attributes</h2>
              <div className="grid grid-cols-2 gap-4">
                {currentCharacter.attributes.map((attr, index) => (
                  <motion.div 
                    key={index}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-gray-700 rounded-lg p-4 flex flex-col items-center justify-between"
                  >
                    <div className="flex items-center mb-2">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="mr-2"
                      >
                        {getAttributeIcon(attr.trait_type)}
                      </motion.div>
                      <span className="font-semibold text-sm items-center">{attr.trait_type}</span>
                    </div>
                    <motion.span 
                      className="font-bold text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 * index }}
                    >
                      {attr.value}
                    </motion.span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 120 }}
            className="flex items-center justify-center w-full my-8"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="mr-8 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full transition-all duration-300 ease-in-out"
              onClick={prevCharacter}
            >
              <ChevronLeft className="h-8 w-8" />
            </motion.button>
            <span className="text-2xl font-semibold">
              {currentIndex + 1} / {characters.length}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-8 bg-gray-800 hover:bg-gray-700 text-white p-4 rounded-full transition-all duration-300 ease-in-out"
              onClick={nextCharacter}
            >
              <ChevronRight className="h-8 w-8" />
            </motion.button>
          </motion.div>

          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, type: "spring", stiffness: 120 }}
            className="flex flex-col items-center"
          >
            {!canChooseNFT && (
              <p className="mt-4 text-red-500">
                You cannot choose a new NFT yet. You can play with your previously chosen NFT.
              </p>
            )}

            {/* Choose or Play Button */}
            <motion.button 
              onClick={handleChooseOrPlay} // Call the new combined function
              disabled={isButtonDisabled} // Disable if in progress
              className={`mt-8 px-12 py-6 text-3xl font-bold text-white rounded-2xl ${
                playerData?.gamesPlayedToday !== undefined && playerData.gamesPlayedToday < 40 
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 cursor-pointer" 
                  : "bg-gray-500 cursor-not-allowed"
              }`}
            >
              {hasChosenNFT ? "Play" : "Choose"} {/* Change button text based on state */}
            </motion.button>

            {playerData?.gamesPlayedToday === 40 && (
              <p className="mt-4 text-red-500">
                You cannot play another game today. You have reached the limit of 40 games.
              </p>
            )}
          </motion.div>
        </>
      )}

      {showConfirmationDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold text-white">Confirm Choice</h2>
            <p className="text-gray-300">Are you sure you want to choose this Flamie? You will be able to change Flamie again in 3 days.</p>
            <div className="flex justify-between mt-4">
              <button onClick={cancelChoice} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500">Cancel</button>
              <button onClick={confirmChoice} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}