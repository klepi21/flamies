/* eslint-disable @typescript-eslint/no-explicit-any, react/jsx-no-duplicate-props */

'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Loader2, Heart, Zap, Wind, Shield, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getStorage, ref, getDownloadURL } from 'firebase/storage'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion'

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

export default function CharacterSelection() {
  const [characters, setCharacters] = useState<NFT[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [direction, setDirection] = useState(0)
  const [fireworks, setFireworks] = useState<{ x: number; y: number }[]>([])
  const router = useRouter()
  const controls = useAnimation()
  const constraintsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNFTs = async () => {
      const address = 'erd1s5ufsgtmzwtp6wrlwtmaqzs24t0p9evmp58p33xmukxwetl8u76sa2p9rv'
      const response = await fetch(`https://multiversx-api.beaconx.app/public-mainnet-api/accounts/${address}/nfts?collection=QXFLM-06e81a`)
      const data = await response.json()

      console.log('Fetched NFT data:', data) // Add this line

      const nftsWithImages = await Promise.all(data.map(async (nft: NFT) => {
        const identifier = nft.identifier
        const imageName = `${identifier}.png`
        const imageRef = ref(storage, `flamies/${imageName}`)
        try {
          const imageUrl = await getDownloadURL(imageRef)
          const docRef = doc(db, "flamies", identifier)
          const docSnap = await getDoc(docRef)
          const attributes = docSnap.exists() ? docSnap.data().attributes : []
          return { identifier, imageUrl, attributes }
        } catch (error) {
          console.error(`Error fetching data for ${identifier}:`, error)
          return null
        }
      }))

      const filteredNFTs = nftsWithImages.filter((nft): nft is NFT => nft !== null)
      console.log('Processed NFTs:', filteredNFTs) // Add this line

      setCharacters(filteredNFTs)
      setLoading(false)
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

  const handlePlay = () => {
    if (characters.length > 0) {
      const selectedCharacter = characters[currentIndex]
      router.push(`/game?identifier=${selectedCharacter.identifier}`)
    }
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

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>No characters available.</p>
        <p className="mt-4">Debug info:</p>
        <pre className="mt-2 p-4 bg-gray-800 rounded">
          {JSON.stringify({ charactersLength: characters.length, loading }, null, 2)}
        </pre>
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
        Choose Your Flamie
      </motion.h1>

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

      <motion.button 
        whileHover={{ scale: 1.05, boxShadow: "0px 0px 8px rgb(59, 130, 246)" }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 120 }}
        onClick={handlePlay}
        className="px-12 py-6 text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl"
      >
        Play
      </motion.button>
    </motion.div>
  )
}