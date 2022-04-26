import { initializeConnector } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'
import { RPC_NETWORK_ID, RPC_URL } from '../constants'

export const [walletConnect, hooks] = initializeConnector<WalletConnect>(
    (actions) =>
        new WalletConnect(actions, {
            rpc: {
                [RPC_NETWORK_ID]: RPC_URL,
            },
        }),
    [RPC_NETWORK_ID],
)
