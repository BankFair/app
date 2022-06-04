import { ReactNode } from 'react'
import { CHAIN, shortenAddress } from '../app'

export function EtherscanAddress({
    address,
    primary,
}: {
    address: string
    primary?: boolean
}) {
    return (
        <a
            className={primary ? 'primary' : ''}
            href={`${CHAIN.blockExplorerUrls[0]}address/${address}`}
            rel="noreferrer noopener"
            target="_blank"
        >
            {shortenAddress(address)}
        </a>
    )
}

export function EtherscanHash({
    hash,
    children,
}: {
    hash: string
    children: ReactNode
}) {
    return (
        <a
            href={`${CHAIN.blockExplorerUrls[0]}tx/${hash}`}
            rel="noreferrer noopener"
            target="_blank"
        >
            {children}
        </a>
    )
}
