import { prefix } from '../app'
import { Box } from './Box'
import { PoolDescription } from './PoolDescription'

export function PoolInfo({
    poolAddress,
    name,
    managerName,
    tokenSymbol,
    uniswapUrl
}: {
    poolAddress: string
    name: string
    managerName: string
    tokenSymbol: string
    uniswapUrl: string
}) {
    return (
        <Box>
            <style jsx>{`
                h2 {
                    font-size: 24px;
                    margin: 0 0 16px;
                }

                .subtitle {
                    color: var(--color-secondary);
                    font-size: 16px;
                    font-weight: 400;
                    margin: 24px 0 0;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    
                    > span {
                      height: 24px;
                      margin-right: 24px;
                      margin-top: 12px;
                      display: flex;
                      align-items: center;
                      
                      > img {
                        width: 24px;
                        height: 24px;
                        margin-right: 8px;
                      }
                    }
                }
            `}</style>
            <h2>{name}</h2>
            <PoolDescription address={poolAddress} />
            <div className="subtitle">
                <span>
                    <img src={`${prefix}/usdt.svg`} alt="USDT logo" />
                    USDT
                </span>
                {managerName ? <span>Pool Manager: {managerName}</span>: <></>}
                {tokenSymbol ? <span>Token: {tokenSymbol}</span>: <></>}
                {uniswapUrl ? <span><a href={uniswapUrl} target={"_blank"} rel="noreferrer">Uniswap pool ↗</a></span>: <></>}
            </div>
        </Box>
    )
}
