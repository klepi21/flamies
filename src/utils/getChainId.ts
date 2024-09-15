import { environment } from '@/config/config.mainnet';
import { chainIdByEnvironment } from '@multiversx/sdk-dapp/constants/network';

export const getChainId = () => {
  return chainIdByEnvironment[environment];
};
