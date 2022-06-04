import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { FiExternalLink } from 'react-icons/fi'
import { BsFillCheckCircleFill, BsExclamationCircleFill } from 'react-icons/bs'
import { GrClose } from 'react-icons/gr'
import { Oval } from 'react-loading-icons'

import { hideTransaction, Transaction as StateTransaction } from '../features'
import { AppDispatch, useDispatch, useSelector } from '../store'
import { rgbGreen, rgbRed, SIDEBAR_ALWAYS_VISIBLE_WIDTH } from '../app'

import { EtherscanHash } from './EtherscanLink'
import { useEffect } from 'react'

function Component() {
    const dispatch = useDispatch()
    const transactions = Object.values(
        useSelector((state) => state.transactions),
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
                // height = (transaction height + transaction margin bottom) * (amount of transactions) + (transaction margin top) - (page padding bottom)
                style={{ height: transactions.length * 45.5 + 8 - 20 }}
            />
            {createPortal(
                <div className="container">
                    {transactions.map((tx) =>
                        tx.visible ? (
                            <Transaction
                                dispatch={dispatch}
                                key={tx.hash}
                                tx={tx}
                            />
                        ) : null,
                    )}
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
    useEffect(() => {
        if (tx.status === 'pending') return

        const timeoutId = setTimeout(() => {
            dispatch(hideTransaction(tx.hash))
        }, 15 * 1000) // 15 seconds

        return () => {
            clearTimeout(timeoutId)
        }
    }, [tx.hash, tx.status, dispatch])

    return (
        <div className={`tx ${tx.status}`}>
            <style jsx>{`
                .tx {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    margin: 8px;
                    border-radius: 10px;
                    border: 1px solid var(--disabled-80);
                    background-color: var(--bg-color);

                    &.completed {
                        border-color: ${rgbGreen};
                    }

                    &.failed {
                        border-color: ${rgbRed};
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
                }
            `}</style>

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
                    dispatch(hideTransaction(tx.hash))
                }}
            />
        </div>
    )
}
