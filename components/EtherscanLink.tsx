import { CHAIN, shortenAddress } from '../app'

export function EtherscanLink({
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
