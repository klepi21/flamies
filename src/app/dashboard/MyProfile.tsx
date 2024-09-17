import React from 'react';
import { Trophy, Skull, Gamepad2, Clock, CalendarCheck, Zap, User, Copy } from 'lucide-react';

interface PlayerData {
  account: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  lastChoosenTimeStamp: number | null;
  gamesPlayedToday: number;
  XP: number;
}

interface MyProfileProps {
  playerData: PlayerData | null;
}

interface LevelInfo {
  level: number;
  xpRequired: number;
  totalXP: number;
}

interface RankInfo {
  name: string;
  minLevel: number;
  maxLevel: number;
}

const levelData: LevelInfo[] = [
  { level: 1, xpRequired: 100, totalXP: 0 },
  { level: 2, xpRequired: 120, totalXP: 100 },
  { level: 3, xpRequired: 140, totalXP: 220 },
  { level: 4, xpRequired: 160, totalXP: 360 },
  { level: 5, xpRequired: 180, totalXP: 520 },
  { level: 6, xpRequired: 200, totalXP: 700 },
  { level: 7, xpRequired: 220, totalXP: 900 },
  { level: 8, xpRequired: 240, totalXP: 1120 },
  { level: 9, xpRequired: 260, totalXP: 1360 },
  { level: 10, xpRequired: 280, totalXP: 1620 },
  { level: 11, xpRequired: 310, totalXP: 1900 },
  { level: 12, xpRequired: 340, totalXP: 2210 },
  { level: 13, xpRequired: 370, totalXP: 2550 },
  { level: 14, xpRequired: 400, totalXP: 2920 },
  { level: 15, xpRequired: 430, totalXP: 3320 },
  { level: 16, xpRequired: 460, totalXP: 3750 },
  { level: 17, xpRequired: 490, totalXP: 4210 },
  { level: 18, xpRequired: 520, totalXP: 4700 },
  { level: 19, xpRequired: 550, totalXP: 5220 },
  { level: 20, xpRequired: 580, totalXP: 5770 },
  { level: 21, xpRequired: 630, totalXP: 6350 },
  { level: 22, xpRequired: 680, totalXP: 6980 },
  { level: 23, xpRequired: 730, totalXP: 7660 },
  { level: 24, xpRequired: 780, totalXP: 8390 },
  { level: 25, xpRequired: 830, totalXP: 9170 },
  { level: 26, xpRequired: 880, totalXP: 10000 },
  { level: 27, xpRequired: 930, totalXP: 10880 },
  { level: 28, xpRequired: 980, totalXP: 11810 },
  { level: 29, xpRequired: 1030, totalXP: 12790 },
  { level: 30, xpRequired: 1080, totalXP: 13820 },
  { level: 31, xpRequired: 1160, totalXP: 14900 },
  { level: 32, xpRequired: 1240, totalXP: 16060 },
  { level: 33, xpRequired: 1320, totalXP: 17300 },
  { level: 34, xpRequired: 1400, totalXP: 18620 },
  { level: 35, xpRequired: 1480, totalXP: 20020 },
  { level: 36, xpRequired: 1560, totalXP: 21500 },
  { level: 37, xpRequired: 1640, totalXP: 23060 },
  { level: 38, xpRequired: 1720, totalXP: 24700 },
  { level: 39, xpRequired: 1800, totalXP: 26420 },
  { level: 40, xpRequired: 1880, totalXP: 28220 },
  { level: 41, xpRequired: 2000, totalXP: 30100 },
  { level: 42, xpRequired: 2120, totalXP: 32100 },
  { level: 43, xpRequired: 2240, totalXP: 34220 },
  { level: 44, xpRequired: 2360, totalXP: 36460 },
  { level: 45, xpRequired: 2480, totalXP: 38820 },
  { level: 46, xpRequired: 2600, totalXP: 41300 },
  { level: 47, xpRequired: 2720, totalXP: 43900 },
  { level: 48, xpRequired: 2840, totalXP: 46620 },
  { level: 49, xpRequired: 2960, totalXP: 49460 },
  { level: 50, xpRequired: 0, totalXP: 52420 },
];

const rankData: RankInfo[] = [
  { name: "Emberling", minLevel: 1, maxLevel: 1 },
  { name: "Spark Initiate", minLevel: 2, maxLevel: 5 },
  { name: "Flicker Flame", minLevel: 6, maxLevel: 10 },
  { name: "Kindler", minLevel: 11, maxLevel: 15 },
  { name: "Flame Adept", minLevel: 16, maxLevel: 20 },
  { name: "Torchbearer", minLevel: 21, maxLevel: 25 },
  { name: "Ember Guardian", minLevel: 26, maxLevel: 30 },
  { name: "Blaze Sentinel", minLevel: 31, maxLevel: 35 },
  { name: "Inferno Wielder", minLevel: 36, maxLevel: 40 },
  { name: "Firestorm Herald", minLevel: 41, maxLevel: 45 },
  { name: "Scorch Master", minLevel: 46, maxLevel: 49 },
  { name: "Pyro Legend", minLevel: 50, maxLevel: 50 },
];

const MyProfile: React.FC<MyProfileProps> = ({ playerData }) => {
  if (!playerData) {
    return (
      <div className="flex items-center justify-center h-64 text-cyan-400">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a toast notification here if you want
      console.log('Address copied to clipboard');
    });
  };

  const getLevelInfo = (xp: number): LevelInfo => {
    return levelData.find(level => level.totalXP > xp) || levelData[levelData.length - 1];
  };

  const getRankInfo = (level: number): RankInfo => {
    return rankData.find(rank => level >= rank.minLevel && level <= rank.maxLevel) || rankData[0];
  };

  const levelInfo = getLevelInfo(playerData.XP);
  const currentLevel = levelInfo.level - 1;
  const rankInfo = getRankInfo(currentLevel);
  const xpForNextLevel = levelInfo.xpRequired;
  const xpProgress = playerData.XP - levelData[currentLevel - 1].totalXP;

  const profileItems = [
    { icon: Trophy, label: 'Wins', value: playerData.wins },
    { icon: Skull, label: 'Losses', value: playerData.losses },
    { icon: Gamepad2, label: 'Games Played', value: playerData.gamesPlayed },
    { icon: Clock, label: 'Last Chosen', value: playerData.lastChoosenTimeStamp ? new Date(playerData.lastChoosenTimeStamp).toLocaleString() : 'N/A' },
    { icon: CalendarCheck, label: 'Games Today', value: playerData.gamesPlayedToday },
    { icon: Zap, label: 'XP', value: playerData.XP },
  ];

  return (
    <div className="bg-gray-900 shadow-2xl rounded-2xl p-8 border-2 border-cyan-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
      <h2 className="text-3xl font-bold mb-6 text-cyan-400 flex items-center">
        <User className="mr-2" /> My Profile
      </h2>
      <div className="mb-6">
        <p className="font-semibold text-cyan-300 mb-1">Account:</p>
        <div className="flex items-center bg-gray-800 p-2 rounded-md">
          <p className="text-sm text-gray-300 break-all mr-2">{truncateAddress(playerData.account)}</p>
          <button
            onClick={() => copyToClipboard(playerData.account)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-200"
            title="Copy full address"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profileItems.map((item, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-cyan-500/20 transition-shadow duration-300">
            <div className="flex items-center mb-2">
              <item.icon className="text-cyan-400 mr-2" size={20} />
              <p className="font-semibold text-cyan-300">{item.label}:</p>
            </div>
            <p className="text-2xl font-bold text-gray-100">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-cyan-400 mb-2">Player Rank</h3>
        <p className="text-gray-300 mb-2">Level {currentLevel} - {rankInfo.name}</p>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full"
            style={{ width: `${(xpProgress / xpForNextLevel) * 100}%` }}
          ></div>
        </div>
        <p className="text-gray-300 mt-2">
          {xpProgress} / {xpForNextLevel} XP to next level
        </p>
      </div>
    </div>
  );
};

export default MyProfile;