import { Web3ReactHooks } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'
import { EIP1193 } from '@web3-react/eip1193'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import { walletConnect, hooks as walletConnectHooks } from './walletconnect'
import { eip1193, hooks as eip1193Hooks } from './eip1193'
import { gnosisSafe, hooks as gnosisSafeHooks } from './gnosisSafe'
import {
    LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT,
    LOCAL_STORAGE_LAST_CONNECTOR_EIP1193,
} from '../constants'

export const connectors: [
    EIP1193 | WalletConnect | GnosisSafe | Network,
    Web3ReactHooks,
][] = [
    [walletConnect, walletConnectHooks],
    [eip1193, eip1193Hooks],
    [gnosisSafe, gnosisSafeHooks],
]

export const connectorsObject = {
    [LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT]: walletConnect,
    [LOCAL_STORAGE_LAST_CONNECTOR_EIP1193]: eip1193,
}

export function useActiveConnector() {
    const isGnosisSafeActive = gnosisSafeHooks.useIsActive()
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEip1193Active = eip1193Hooks.useIsActive()

    if (isGnosisSafeActive) {
        return gnosisSafe
    } else if (isWalletConnectActive) {
        return walletConnect
    } else if (isEip1193Active) {
        return eip1193
    }
}

export function useProvider() {
    const isGnosisSafeActive = gnosisSafeHooks.useIsActive()
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEip1193Active = eip1193Hooks.useIsActive()

    const gnosisSafeProvider = gnosisSafeHooks.useProvider()
    const walletConnectProvider = walletConnectHooks.useProvider()
    const eip1193Provider = eip1193Hooks.useProvider()

    if (isGnosisSafeActive) {
        return gnosisSafeProvider
    } else if (isWalletConnectActive) {
        return walletConnectProvider
    } else if (isEip1193Active) {
        return eip1193Provider
    }
}

export function useError() {
    const gnosisSafeError = gnosisSafeHooks.useError()
    const walletConnectError = walletConnectHooks.useError()
    const eip1193Error = eip1193Hooks.useError()

    return { gnosisSafeError, eip1193Error, walletConnectError }
}

export function useAccount() {
    const isGnosisSafeActive = gnosisSafeHooks.useIsActive()
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEip1193Active = eip1193Hooks.useIsActive()

    const gnosisSafeAccount = gnosisSafeHooks.useAccount()
    const walletConnectAccount = walletConnectHooks.useAccount()
    const eip1193Account = eip1193Hooks.useAccount()

    if (isGnosisSafeActive) {
        return gnosisSafeAccount
    } else if (isWalletConnectActive) {
        return walletConnectAccount
    } else if (isEip1193Active) {
        return eip1193Account
    }
}

export function useWeb3(forConnector?: Connector): {
    connector: Connector
    account: string | undefined
    chainId: number | undefined
} | null {
    const isGnosisSafeActive = gnosisSafeHooks.useIsActive()
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEIP1193Active = eip1193Hooks.useIsActive()

    const gnosisSafeAccount = gnosisSafeHooks.useAccount()
    const walletConnectAccount = walletConnectHooks.useAccount()
    const eip1193Account = eip1193Hooks.useAccount()

    const gnosisSafeChainId = gnosisSafeHooks.useChainId()
    const walletConnectChainId = walletConnectHooks.useChainId()
    const eip1193ChainId = eip1193Hooks.useChainId()

    if (arguments.length === 1) {
        if (forConnector === gnosisSafe) {
            return {
                connector: gnosisSafe,
                account: gnosisSafeAccount,
                chainId: gnosisSafeChainId,
            }
        } else if (forConnector === walletConnect) {
            return {
                connector: walletConnect,
                account: walletConnectAccount,
                chainId: walletConnectChainId,
            }
        } else if (forConnector === eip1193) {
            return {
                connector: eip1193,
                account: eip1193Account,
                chainId: eip1193ChainId,
            }
        }
    } else {
        if (isGnosisSafeActive) {
            return {
                connector: gnosisSafe,
                account: gnosisSafeAccount,
                chainId: gnosisSafeChainId,
            }
        } else if (isWalletConnectActive) {
            return {
                connector: walletConnect,
                account: walletConnectAccount,
                chainId: walletConnectChainId,
            }
        } else if (isEIP1193Active) {
            return {
                connector: eip1193,
                account: eip1193Account,
                chainId: eip1193ChainId,
            }
        }
    }

    return null
}
