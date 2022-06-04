import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FiExternalLink } from 'react-icons/fi'
import { BsFillCheckCircleFill, BsExclamationCircleFill } from 'react-icons/bs'
import { GrClose } from 'react-icons/gr'
import { Oval } from 'react-loading-icons'
import { CSSTransition } from 'react-transition-group'

import { hideTransaction, Transaction as StateTransaction } from '../features'
import { AppDispatch, useDispatch, useSelector } from '../store'
import { rgbGreen, rgbRed, SIDEBAR_ALWAYS_VISIBLE_WIDTH } from '../app'

import { EtherscanHash } from './EtherscanLink'

function Component() {
    const dispatch = useDispatch()
    const transactions = useSelector((state) => state.transactions)

    const visibleTransactions = useMemo(
        () => Object.values(transactions).filter((tx) => tx.visible),
        [transactions],
    )

    return (
        <>
            <style jsx>{`
                .container {
                    position: fixed;
                    z-index: 10;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    margin-bottom: 4px;

                    @media screen and (min-width: 500px) {
                        width: 280px;
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .pusher {
                        display: none;
                    }
                }
            `}</style>
            <div
                className="pusher"
                // height = (transaction height) * (amount of transactions) + (transaction container margin bottom) - (page padding bottom)
                style={{ height: visibleTransactions.length * 48 + 4 - 20 }}
            />
            {createPortal(
                <div className="container">
                    <div className="dummy" />
                    {visibleTransactions.map((tx) => (
                        <Transaction
                            dispatch={dispatch}
                            key={tx.hash}
                            tx={tx}
                        />
                    ))}
                </div>,
                document.body,
            )}
        </>
    )
}

export const TransactionNotifications = dynamic(
    () => Promise.resolve(Component),
    { ssr: false },
)

function Transaction({
    tx,
    dispatch,
}: {
    tx: StateTransaction
    dispatch: AppDispatch
}) {
    const [shouldShow, setShouldShow] = useState(true)
    useEffect(() => {
        if (tx.status === 'pending') return

        const timeoutId = setTimeout(() => {
            setShouldShow(false)
        }, 15 * 1000) // 15 seconds

        return () => {
            clearTimeout(timeoutId)
        }
    }, [tx.status])

    return (
        <>
            <style jsx>{`
                .tx-container {
                    overflow: hidden;

                    &.tx-enter,
                    &.tx-appear {
                        opacity: 0;
                        height: 0;
                        transform: scale(0.5);
                    }
                    &.tx-enter-active,
                    &.tx-appear-active {
                        opacity: 1;
                        height: 48px;
                        transform: translateX(0);
                        transition: opacity 300ms, transform 300ms, height 300ms;
                    }
                    &.tx-exit {
                        opacity: 1;
                        height: 48px;
                        transform: translateX(0);
                    }
                    &.tx-exit-active {
                        opacity: 0;
                        height: 0;
                        transform: scale(0.5);
                        transition: opacity 300ms, transform 300ms, height 300ms;
                    }
                }

                .tx {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    margin: 4px 8px;
                    border-radius: 10px;
                    border: 1px solid var(--disabled-80);
                    background-color: var(--bg-color);

                    &.completed {
                        border-color: ${rgbGreen};
                    }

                    &.failed {
                        border-color: ${rgbRed};
                    }

                    > :first-child {
                        flex-shrink: 0;
                    }

                    > :global(a) {
                        color: var(--color-secondary);
                        border: 1px solid var(--color-secondary);
                        border-radius: 50%;
                        padding: 4px;

                        > :global(svg) {
                            display: block;
                        }
                    }

                    > :global(.close) {
                        margin-left: 8px;
                        cursor: pointer;

                        > :global(path) {
                            stroke: var(--color-secondary);
                        }
                    }
                }

                .name {
                    margin: 0 4px;
                    flex-grow: 1;
                    font-size: 16px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
            <CSSTransition
                in={shouldShow}
                timeout={300}
                appear
                classNames="tx"
                onExited={() => dispatch(hideTransaction(tx.hash))}
            >
                <div className="tx-container">
                    <div className={`tx ${tx.status}`}>
                        {tx.status === 'pending' ? (
                            <Oval
                                speed={0.7}
                                width={18}
                                height={18}
                                stroke="currentColor"
                            />
                        ) : tx.status === 'failed' ? (
                            <BsExclamationCircleFill size={18} color={rgbRed} />
                        ) : (
                            <BsFillCheckCircleFill size={18} color={rgbGreen} />
                        )}
                        <div className="name">{tx.name}</div>
                        <EtherscanHash hash={tx.hash}>
                            <FiExternalLink size={12} />
                        </EtherscanHash>
                        <GrClose
                            className="close"
                            onClick={() => {
                                setShouldShow(false)
                            }}
                        />
                    </div>
                </div>
            </CSSTransition>
        </>
    )
}
