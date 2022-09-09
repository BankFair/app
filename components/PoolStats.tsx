import { formatCurrency, formatPercent } from '../app'
import { Pool, useStats } from '../features'
import { Box } from './Box'
import { Skeleton } from './Skeleton'

export function PoolStats({
    pool: { managerAddress, liquidityTokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const stats = useStats(poolAddress, liquidityTokenDecimals)

    return (
        <div className="stats-container">
            <style jsx>{`
                .stats-container > :global(.box) {
                    display: flex;
                    flex-direction: column;
                    flex-basis: 33%;

                    > .title,
                    > .stat > .number {
                        color: var(--color);
                        font-size: 16px;
                        font-weight: 700;
                    }

                    > .stat {
                        margin-top: 24px;

                        > .label {
                            color: var(--color-secondary);
                            margin-bottom: 8px;
                            font-size: 15px;
                            font-weight: 400;
                        }
                    }
                }

                @media screen and (min-width: 800px) {
                    .stats-container {
                        display: flex;

                        > :global(.box) {
                            margin: 0;

                            &:nth-child(2) {
                                margin: 0 16px;
                            }
                        }
                    }
                }
            `}</style>
            <Box>
                <div className="title">Pool size</div>
                <div className="stat">
                    <div className="label">Current pool size</div>
                    <div className="number">
                        {stats ? (
                            formatCurrency(
                                stats.totalPoolSize,
                                liquidityTokenDecimals,
                                0,
                            )
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Loans Outstanding</div>
                    <div className="number">
                        {stats ? (
                            formatCurrency(
                                stats.loansOutstanding,
                                liquidityTokenDecimals,
                                0,
                            )
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
            </Box>
            <Box>
                <div className="title">Liquidity</div>
                <div className="stat">
                    <div className="label">Space for additional funds</div>
                    <div className="number">
                        {stats ? (
                            formatCurrency(
                                stats.availableForDeposits,
                                liquidityTokenDecimals,
                                0,
                            )
                        ) : (
                            <Skeleton width={70} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Withdrawable liquidity</div>
                    <div className="number">
                        {stats ? (
                            formatCurrency(
                                stats.poolLiquidity,
                                liquidityTokenDecimals,
                                0,
                            )
                        ) : (
                            <Skeleton width={70} />
                        )}
                    </div>
                </div>
            </Box>
            <Box>
                <div className="title">Security</div>
                <div className="stat">
                    <div className="label">First loss capital</div>
                    <div className="number">
                        {stats ? (
                            formatCurrency(
                                stats.managerFunds,
                                liquidityTokenDecimals,
                                0,
                            )
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Loss buffer</div>
                    <div className="number">
                        {stats ? (
                            formatPercent(stats.lossBuffer)
                        ) : (
                            <Skeleton width={30} />
                        )}
                    </div>
                </div>
            </Box>
        </div>
    )
}
