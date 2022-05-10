import { getAddress } from '@ethersproject/address'

export const networks = {
    optimism: 10,
    kovan: 42,
    optimismKovan: 69,
}

export const APP_NAME = 'Bankfair'
export const SIDEBAR_ALWAYS_VISIBLE_WIDTH = '700'

export const RPC_NETWORK_ID = networks.optimismKovan
export const RPC_URL =
    (RPC_NETWORK_ID as number) === networks.optimism
        ? 'https://mainnet.optimism.io/'
        : RPC_NETWORK_ID === networks.optimismKovan
        ? 'https://kovan.optimism.io/'
        : RPC_NETWORK_ID === networks.kovan
        ? 'https://kovan.poa.network/'
        : ''
export const CHAIN = {
    chainId: `0x${RPC_NETWORK_ID.toString(16)}`,
    chainName:
        (RPC_NETWORK_ID as number) === networks.optimism
            ? 'Optimism'
            : RPC_NETWORK_ID === networks.optimismKovan
            ? 'Optimism Kovan'
            : RPC_NETWORK_ID === networks.kovan
            ? 'Kovan'
            : 'Unknown Network',
    nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
    },
    rpcUrls: [RPC_URL],
    blockExplorerUrls:
        (RPC_NETWORK_ID as number) === networks.optimism
            ? ['https://optimistic.etherscan.io/']
            : RPC_NETWORK_ID === networks.optimismKovan
            ? ['https://kovan-optimistic.etherscan.io/']
            : RPC_NETWORK_ID === networks.kovan
            ? ['https://kovan.etherscan.io/']
            : [],
}

export const COLOR_GREEN = '#15ab54'
export const COLOR_BLUE = '#3790ff'
export const COLOR_RED = '#FF4842'

export const LOCAL_STORAGE_LAST_CONNECTOR_KEY = 'bankfair_lastConnector'
export const LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT = 'WalletConnect'
export const LOCAL_STORAGE_LAST_CONNECTOR_EIP1193 = 'EIP1193'

export const CONTRACT_ADDRESS = getAddress(
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
)

export const TOKEN_SYMBOL = 'USDC'
