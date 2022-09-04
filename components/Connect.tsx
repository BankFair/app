import { useEffect, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import { walletConnect } from '../app/connectors/walletconnect'
import { eip1193 } from '../app/connectors/eip1193'
import { useWeb3React } from '@web3-react/core'
import {
    APP_NAME,
    LOCAL_STORAGE_LAST_CONNECTOR_EIP1193,
    LOCAL_STORAGE_LAST_CONNECTOR_WALLETCONNECT,
    prefix,
    RPC_NETWORK_ID,
    useError,
} from '../app'
import { useDispatch } from 'react-redux'
import { setLastConnectorName } from '../features/web3/web3Slice'

import { Button } from './Button'
import { Modal } from './Modal'
import { Box } from './Box'

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

                    > img {
                        width: 28px;
                        height: 28px;
                    }

                    > h2 {
                        margin: 0 0 0 10px;
                        font-size: 18px;
                    }
                }

                .wallets {
                    text-align: center;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;

                    > :global(div) {
                        width: 320px;
                        max-width: 320px;
                        margin: 20px;

                        > div {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            height: 80px;
                            color: var(--color-secondary);
                        }
                    }
                }

                @media screen and (min-width: 480px) {
                    header {
                        > img {
                            width: 32px;
                            height: 32px;
                        }

                        > h2 {
                            font-size: 24px;
                        }
                    }
                }
            `}</style>

            <header>
                <img src={`${prefix}/polygon.svg`} alt="Polygon" />
                <h2>{APP_NAME} runs on Polygon</h2>
            </header>

            <div className="wallets">
                <Box>
                    {isMetaMask ? (
                        <img
                            src={`${prefix}/metamask.svg`}
                            width={48}
                            height={48}
                            alt="MetaMask logo"
                        />
                    ) : (
                        <FaWallet size={32} />
                    )}
                    <div>
                        <h4>
                            Connect to your{' '}
                            {isMetaMask ? 'MetaMask' : 'browser'} wallet
                        </h4>
                    </div>
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
                </Box>

                <Box>
                    <img
                        src={`${prefix}/walletconnect.svg`}
                        width={48}
                        height={48}
                        alt="WalletConnect logo"
                    />
                    <div>
                        <h4>Scan with WalletConnect to connect</h4>
                    </div>
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
                </Box>
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
