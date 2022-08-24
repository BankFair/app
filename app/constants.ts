import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'

export const networks = {
    optimism: 10,
    kovan: 42,
    optimismKovan: 69,
    hardhat: 31337,
    mumbai: 80001,
}

export const APP_NAME = 'Sapling'
export const SIDEBAR_ALWAYS_VISIBLE_WIDTH = '700'

export const RPC_NETWORK_ID = networks.mumbai
export const RPC_URL =
    (RPC_NETWORK_ID as number) === networks.optimism
        ? 'https://mainnet.optimism.io/'
        : RPC_NETWORK_ID === networks.optimismKovan
        ? 'https://kovan.optimism.io/'
        : RPC_NETWORK_ID === networks.kovan
        ? 'https://kovan.poa.network/'
        : RPC_NETWORK_ID === networks.mumbai
        ? 'https://matic-mumbai.chainstacklabs.com'
        : RPC_NETWORK_ID === networks.hardhat
        ? 'http://127.0.0.1:8545/'
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
            : RPC_NETWORK_ID === networks.mumbai
            ? 'Mumbai'
            : RPC_NETWORK_ID === networks.hardhat
            ? 'Hardhat'
            : 'Unknown Network',
    nativeCurrency:
        RPC_NETWORK_ID === networks.mumbai
            ? {
                  name: 'Matic',
                  symbol: 'MATIC',
                  decimals: 18,
              }
            : {
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
            : RPC_NETWORK_ID === networks.mumbai
            ? ['https://mumbai.polygonscan.com/']
            : RPC_NETWORK_ID === networks.hardhat
            ? ['http://invalid/']
            : [],
}

export const LOCAL_STORAGE_LAST_CONNECTOR_KEY = 'sapling_lastConnector'
export const LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT = 'WalletConnect'
export const LOCAL_STORAGE_LAST_CONNECTOR_EIP1193 = 'EIP1193'

type PoolsEnv = {
    name: string
    block: number
    address: string
    description: string
}[]
export const POOLS = (JSON.parse(process.env.POOLS!) as PoolsEnv).map(
    ({ name, block, address, description }) => ({
        name,
        block,
        address: getAddress(address),
        description,
    }),
)

export const TOKEN_SYMBOL = 'USDT'
export const USDT_DECIMALS = 6
export const oneHundredPercent = 1000
export const ONE_HUNDRED_PERCENT = BigNumber.from(oneHundredPercent)

export const BORROWER_SERVICE_URL =
    'https://test-borrower-api.sapling.workers.dev'
// export const BORROWER_SERVICE_URL = 'http://localhost:8787'

export const prefix = process.env.BUILDING_FOR_GITHUB_PAGES ? '/app' : ''

export const zero = BigNumber.from(0)

export const commonBoxShadow = '0px 28px 32px -16px rgba(66, 117, 48, 0.19)'
export const commonDarkBoxShadow = `0px 28px 32px -16px #000000, ${commonBoxShadow}`

export const oneDay = 86400
export const thirtyDays = oneDay * 30
