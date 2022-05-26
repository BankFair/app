import { getAddress } from '@ethersproject/address'
import { BigNumber } from 'ethers'

export const networks = {
    optimism: 10,
    kovan: 42,
    optimismKovan: 69,
}

export const APP_NAME = 'Sapling'
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

export const LOCAL_STORAGE_LAST_CONNECTOR_KEY = 'sapling_lastConnector'
export const LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT = 'WalletConnect'
export const LOCAL_STORAGE_LAST_CONNECTOR_EIP1193 = 'EIP1193'

type PoolsEnv = { name: string; address: string }[]
export const POOLS = (JSON.parse(process.env.POOLS!) as PoolsEnv).map(
    ({ name, address }) => ({
        name,
        address: getAddress(address),
    }),
)

export const TOKEN_SYMBOL = 'USDC'
export const USDC_DECIMALS = 6
export const oneHundredPercent = 1000
export const ONE_HUNDRED_PERCENT = BigNumber.from(oneHundredPercent)

export const prefix = process.env.BUILDING_FOR_GITHUB_PAGES ? '/app' : ''

export const zero = BigNumber.from(0)
