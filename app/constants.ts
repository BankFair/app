import { BigNumber } from '@ethersproject/bignumber'
import { Address, Hexadecimal } from './types'

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

export const CHAIN_ID =
    process.env.BUILDING_CLOUDFLARE_PREVIEW ||
    process.env.BUILDING_FOR_GITHUB_PAGES ||
    process.env.NODE_ENV === 'development'
        ? chains.mumbai
        : chains.polygon
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

export const poolsConfig =
    CHAIN_ID === chains.polygon
        ? [
              {
                  name: 'Kitale Community Pool (Uganda)',
                  managerName: 'Ausciery Emerson',
                  tokenSymbol: 'KITCP',
                  uniswapUrl: 'https://app.uniswap.org/#/swap?exactField=input&exactAmount=10&inputCurrency=0xc2132D05D31c914a87C6611C10748AEb04B58e8F&outputCurrency=0xcC9Fa0dBA57C1E22029aA81cB1144917DADe8BCc',
                  address: '0xA3e07757131E5587ebB58ABB08de10783FC090Be' as Address,
                  manager: '0x9e998fE5504b55ACD6ce68fdA1b29958AD3Bc7cc' as Address,
                  block: 33073758,
              },
              {
                  name: 'Iki-Iki Farmers Pool (Uganda)',
                  managerName: 'Regina Nagudi',
                  tokenSymbol: 'IKIFP',
                  uniswapUrl: '',
                  address: '0x70527768dB88924985460fCada217E2AEDb9a620' as Address,
                  manager: '0x03E07430eb36B9b7E5CBFaBF3c4501fDd9449902' as Address,
                  block: 34535380,
              },
              {
                  name: 'Namirembe Women’s Pool (Uganda)',
                  managerName: 'Regina Nagudi',
                  tokenSymbol: 'NAMWP',
                  uniswapUrl: '',
                  address: '0x925A62Cd68f73111730AC0E99F8b116Ef767EE01' as Address,
                  manager: '0xE3DFa260ea263fc43BEb2C1bDd488A0bFBf54B48' as Address,
                  block: 34777549,
              },
              {
                  name: 'Training Pool',
                  address: '0x24c6ec0283EbCe4703f4667880Dd8b048e48e850' as Address,
                  manager: '' as Address,
                  block: 33598587,
              },
          ]
        : [
              {
                  name: 'Test Pool 1',
                  address: '0xADC6b846bdA2909a9218a9E7957aa0469B96626B' as Address,
                  manager: '0x457aBC13c93D34FEc541C78aF91f64531eEe2516' as Address,
                  block: 29900994,
              },
          ]

export const TOKEN_SYMBOL = 'USDT'
export const USDT_DECIMALS = 6
export const oneHundredPercent = 1000
export const ONE_HUNDRED_PERCENT = BigNumber.from(oneHundredPercent)
export const USD_TO_UGX_FX = 3850.0;
export const UGX_CODE = 'UGX';

export const BORROWER_SERVICE_URL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:8010/proxy'
        : CHAIN_ID === chains.mumbai
        ? 'https://test-borrower-api.sapling.workers.dev'
        : 'https://borrower-api.sapling.finance'
export const LENDER_SERVICE_URL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:8011/proxy'
        : CHAIN_ID === chains.mumbai
        ? 'https://test-lender-api.sapling.workers.dev'
        : 'https://lender-api.sapling.finance'

export const LENDER_GATE_ON = false

export const prefix = process.env.BUILDING_FOR_GITHUB_PAGES ? '/app' : ''

export const zero = BigNumber.from(0)
export const zeroHex = '0x0' as Hexadecimal

export const commonBoxShadow = '0px 28px 32px -16px rgba(66, 117, 48, 0.19)'
export const commonDarkBoxShadow = `0px 28px 32px -16px #000000, ${commonBoxShadow}`

export const oneDay = 86400
export const thirtyDays = oneDay * 30
export const oneYear = 365 * oneDay
