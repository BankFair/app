import { useEffect, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import { walletConnect } from '../app/connectors/walletconnect'
import { eip1193 } from '../app/connectors/eip1193'
import { useWeb3React } from '@web3-react/core'
import {
    APP_NAME,
    LOCAL_STORAGE_LAST_CONNECTOR_EIP1193,
    LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT,
    RPC_NETWORK_ID,
    useError,
} from '../app'
import { useDispatch } from 'react-redux'
import { setLastConnectorName } from '../features/web3/web3Slice'

import { Button } from './Button'
import { Modal } from './Modal'

const prefix = process.env.BUILDING_FOR_GITHUB_PAGES ? '/app' : ''

export function Connect() {
    const { isActivating } = useWeb3React()
    const dispatch = useDispatch()
    const { eip1193Error } = useError()

    const [isMetaMask, setIsMetaMask] = useState(true)
    useEffect(() => {
        if (
            !Boolean(
                typeof window === 'object' &&
                    (window as any).ethereum?.isMetaMask,
            )
        ) {
            setIsMetaMask(false)
        }
    }, [])

    return (
        <>
            <style jsx>{`
                header {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 10px 0;

                    > h2 {
                        margin: 0 0 0 10px;
                    }
                }

                .wallet {
                    max-width: 300px;
                    margin: 20px auto;
                    border: 1px solid grey;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px 10px;
                    text-align: center;
                }
            `}</style>

            <header>
                <img
                    src={`${prefix}/optimism.svg`}
                    width={32}
                    height={32}
                    alt="Optimism"
                />
                <h2>{APP_NAME} runs on Optimism</h2>
            </header>

            <div className="wallet">
                {isMetaMask ? (
                    <img
                        src={`${prefix}/metamask.svg`}
                        width={32}
                        height={32}
                        alt="MetaMask logo"
                    />
                ) : (
                    <FaWallet size={32} />
                )}
                <h4>
                    Connect to your {isMetaMask ? 'MetaMask' : 'browser'} wallet
                </h4>
                <Button
                    disabled={isActivating}
                    onClick={() => {
                        if (!(window as any).ethereum) {
                            alert('No browser wallet detected')
                            return
                        }

                        eip1193.activate().then(() => {
                            dispatch(
                                setLastConnectorName(
                                    LOCAL_STORAGE_LAST_CONNECTOR_EIP1193,
                                ),
                            )
                        })
                    }}
                >
                    Connect {isMetaMask ? 'MetaMask' : 'browser wallet'}
                </Button>
            </div>

            <div className="wallet">
                <img
                    src={`${prefix}/walletconnect.svg`}
                    width={32}
                    height={32}
                    alt="WalletConnect logo"
                />
                <h4>Scan with WalletConnect to connect</h4>
                <Button
                    disabled={isActivating}
                    onClick={() => {
                        walletConnect
                            .activate(RPC_NETWORK_ID)
                            .then(() => {
                                dispatch(
                                    setLastConnectorName(
                                        LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT,
                                    ),
                                )
                            })
                            .catch((error: any) => {
                                console.error(error)
                            })
                    }}
                >
                    Use WalletConnect
                </Button>
            </div>

            {typeof eip1193Error === 'object' &&
                (eip1193Error as unknown as { code: number }).code === -32002 &&
                eip1193Error.message ===
                    'Already processing eth_requestAccounts. Please wait.' && (
                    <OpenBrowserWalletModal />
                )}
        </>
    )
}

export function OpenBrowserWalletModal() {
    const [isClosed, setIsClosed] = useState(false)

    return isClosed ? null : (
        <Modal onClose={() => setIsClosed(true)}>
            Open your browser wallet to continue
        </Modal>
    )
}
