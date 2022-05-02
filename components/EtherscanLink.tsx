import { CHAIN, shortenAddress } from '../app'

export function EtherscanLink({ address }: { address: string }) {
    return (
        <a
            href={`${CHAIN.blockExplorerUrls[0]}address/${address}`}
            rel="noreferrer noopener"
            target="_blank"
        >
            {shortenAddress(address)}
        </a>
    )
}
