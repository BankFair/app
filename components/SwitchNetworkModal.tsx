import { Modal } from './Modal'
import { eip1193 } from '../app/connectors/eip1193'
import { CHAIN, RPC_NETWORK_ID, useWeb3 } from '../app'
import { Button } from './Button'
import { useDispatch, useSelector } from 'react-redux'
import {
    clearLastConnectorName,
    selectLastConnector,
} from '../features/web3/web3Slice'
import { walletConnect } from '../app/connectors/walletconnect'

export function SwitchNetworkModal() {
    const lastConnector = useSelector(selectLastConnector)
    const web3 = useWeb3(lastConnector)
    const dispatch = useDispatch()

    if (!web3 || !web3.chainId || web3.chainId === RPC_NETWORK_ID) return null

    return (
        <Modal>
            <style jsx>{`
                div {
                    margin: 10px;
                    text-align: center;
                }

                .buttons {
                    display: flex;
                    margin-bottom: 8px;
                    justify-content: center;

                    > :global(button:first-child) {
                        margin-right: 10px;
                    }
                }
            `}</style>
            <div>Please connect to {CHAIN.chainName}</div>
            <div className="buttons">
                <Button
                    onClick={() => {
                        const provider =
                            lastConnector === eip1193
                                ? (window as any).ethereum
                                : lastConnector === walletConnect
                                ? lastConnector.provider
                                : null
                        if (!provider) return
                        switchNetwork(provider)
                    }}
                >
                    Switch network
                </Button>
                <Button
                    onClick={() => {
                        dispatch(clearLastConnectorName())
                        web3.connector.deactivate()
                    }}
                >
                    Disconnect
                </Button>
            </div>
        </Modal>
    )
}

function switchNetwork(provider: any) {
    provider
        .request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN.chainId }],
        })
        .catch((error: any) => {
            if (typeof error === 'object') {
                if (error.message === 'User rejected the request.') {
                    return
                }
            }

            return (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [CHAIN],
            })
        })
        .catch((error: any) => {
            if (typeof error === 'object') {
                if (
                    error.message === 'May not specify default MetaMask chain.'
                ) {
                    // https://github.com/MetaMask/controllers/issues/740
                    alert(
                        'You will need to add the Optimism network manually due to a known bug in MetaMask Mobile',
                    )
                }
            }

            console.error('Failed to switch network with error:', error)
        })
}
