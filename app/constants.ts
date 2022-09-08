import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'

export const chains = {
    optimism: 10,
    kovan: 42,
    optimismKovan: 69,
    polygon: 137,
    hardhat: 31337,
    mumbai: 80001,
}

export const APP_NAME = 'Sapling'
export const SIDEBAR_ALWAYS_VISIBLE_WIDTH = '700'

export const CHAIN_ID = chains.mumbai
export const RPC_URL =
    CHAIN_ID === chains.polygon
        ? 'https://polygon-rpc.com/'
        : CHAIN_ID === chains.mumbai
        ? 'https://matic-mumbai.chainstacklabs.com'
        : CHAIN_ID === chains.optimism
        ? 'https://mainnet.optimism.io/'
        : CHAIN_ID === chains.optimismKovan
        ? 'https://kovan.optimism.io/'
        : CHAIN_ID === chains.kovan
        ? 'https://kovan.poa.network/'
        : CHAIN_ID === chains.hardhat
        ? 'http://127.0.0.1:8545/'
        : ''
export const CHAIN = {
    chainId: `0x${CHAIN_ID.toString(16)}`,
    chainName:
        CHAIN_ID === chains.polygon
            ? 'Polygon'
            : CHAIN_ID === chains.mumbai
            ? 'Mumbai'
            : CHAIN_ID === chains.optimism
            ? 'Optimism'
            : CHAIN_ID === chains.optimismKovan
            ? 'Optimism Kovan'
            : CHAIN_ID === chains.kovan
            ? 'Kovan'
            : CHAIN_ID === chains.hardhat
            ? 'Hardhat'
            : 'Unknown Network',
    nativeCurrency:
        CHAIN_ID === chains.polygon || CHAIN_ID === chains.mumbai
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
        CHAIN_ID === chains.polygon
            ? ['https://polygonscan.com/']
            : CHAIN_ID === chains.mumbai
            ? ['https://mumbai.polygonscan.com/']
            : CHAIN_ID === chains.optimism
            ? ['https://optimistic.etherscan.io/']
            : CHAIN_ID === chains.optimismKovan
            ? ['https://kovan-optimistic.etherscan.io/']
            : CHAIN_ID === chains.kovan
            ? ['https://kovan.etherscan.io/']
            : CHAIN_ID === chains.hardhat
            ? ['http://invalid/']
            : [],
}

export const LOCAL_STORAGE_LAST_CONNECTOR_KEY = 'sapling_lastConnector'
export const LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT = 'WalletConnect'
export const LOCAL_STORAGE_LAST_CONNECTOR_EIP1193 = 'EIP1193'
export const LOCAL_STORAGE_BORROWER_INFO_AUTH_KEY_PREFIX =
    'sapling_borrowerInfoAuth_'

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
