import { Web3ReactHooks } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'
import { EIP1193 } from '@web3-react/eip1193'
import { Network } from '@web3-react/network'
import { Connector } from '@web3-react/types'
import { walletConnect, hooks as walletConnectHooks } from './walletconnect'
import { eip1193, hooks as eip1193Hooks } from './eip1193'
import {
    LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT,
    LOCAL_STORAGE_LAST_CONNECTOR_EIP1193,
} from '../constants'

export const connectors: [EIP1193 | WalletConnect | Network, Web3ReactHooks][] =
    [
        [walletConnect, walletConnectHooks],
        [eip1193, eip1193Hooks],
    ]

export const connectorsObject = {
    [LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT]: walletConnect,
    [LOCAL_STORAGE_LAST_CONNECTOR_EIP1193]: eip1193,
}

export function useActiveConnector() {
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEip1193Active = eip1193Hooks.useIsActive()

    if (isWalletConnectActive) {
        return walletConnect
    } else if (isEip1193Active) {
        return eip1193
    }
}

export function useAccount() {
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEip1193Active = eip1193Hooks.useIsActive()

    const walletConnectAccount = walletConnectHooks.useAccount()
    const eip1193Account = eip1193Hooks.useAccount()

    if (isWalletConnectActive) {
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
    const isWalletConnectActive = walletConnectHooks.useIsActive()
    const isEIP1193Active = eip1193Hooks.useIsActive()

    const walletConnectAccount = walletConnectHooks.useAccount()
    const eip1193Account = eip1193Hooks.useAccount()

    const walletConnectChainId = walletConnectHooks.useChainId()
    const eip1193ChainId = eip1193Hooks.useChainId()

    if (arguments.length === 1) {
        if (forConnector === walletConnect) {
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
        if (isWalletConnectActive) {
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
