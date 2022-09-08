import { initializeConnector } from '@web3-react/core'
import { WalletConnect } from '@web3-react/walletconnect'
import { CHAIN_ID, RPC_URL } from '../constants'

export const [walletConnect, hooks] = initializeConnector<WalletConnect>(
    (actions) =>
        new WalletConnect(actions, {
            rpc: {
                [CHAIN_ID]: RPC_URL,
            },
        }),
    [CHAIN_ID],
)
