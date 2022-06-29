import { Pool, useStats } from '../features'
import { Box } from './Box'
import { formatNoDecimals, prefix } from '../app'
import { Skeleton } from './Skeleton'
import { PoolDescription } from './PoolDescription'

export function PoolStats({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
    description,
}: {
    pool: Pool
    poolAddress: string
    description: string
}) {
    const stats = useStats(poolAddress, tokenDecimals)

    return (
        <Box>
            <style jsx>{`
                .title {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    > h3 {
                        margin: 0;
                        font-weight: 700;
                        font-size: 16px;
                    }

                    > .manager {
                        display: none;
                        font-size: 13px;
                        > .label {
                            color: var(--color-secondary);
                            margin-right: 4px;
                        }
                    }
                }
                .subtitle {
                    color: var(--color-secondary);
                    font-size: 16px;
                    font-weight: 400;
                    margin: 6px 0 24px;
                    display: flex;
                    align-items: center;

                    > img {
                        width: 24px;
                        height: 24px;
                        margin-right: 8px;
                    }
                }
                .stats {
                    display: flex;
                    flex-wrap: wrap;

                    > .stat {
                        flex-basis: 50%;
                        > .number {
                            color: var(--color);
                            font-size: 16px;
                            font-weight: 700;
                        }

                        > .label {
                            color: var(--color-secondary);
                            margin-bottom: 8px;
                            font-size: 14px;
                            font-weight: 400;
                        }
                    }

                    &.small {
                        margin-top: 24px;
                        margin-bottom: 16px;

                        > .stat {
                            margin-bottom: 8px;
                        }
                    }
                    &.large {
                        > .stat {
                            > .number {
                                font-size: 24px;
                            }
                        }
                    }
                }

                @media screen and (min-width: 420px) {
                    .title > .manager {
                        display: block;
                    }
                }

                @media screen and (min-width: 860px) {
                    .stats {
                        > .stat {
                            flex-basis: 20%;
                        }
                        &.large {
                            > .stat {
                                &:last-child {
                                    flex-basis: 30%;
                                }

                                width: 120px;
                            }
                        }
                    }
                }
            `}</style>
            <div className="title">
                <h3>Pool Status</h3>
                {/* <div className="manager">
                    <span className="label">Pool Manager</span>
                    {managerAddress && (
                        <EtherscanAddress address={managerAddress} primary />
                    )}
                </div> */}
            </div>
            <div className="subtitle">
                <img src={`${prefix}/usdc.svg`} alt="USDC logo" />
                USDC
            </div>
            {description && <PoolDescription text={description} />}
            <div className="stats small">
                <div className="stat">
                    <div className="label">Total Pool Size</div>
                    <div className="number">
                        {stats ? (
                            `$${formatNoDecimals(stats.totalPoolSize)}`
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Loans Outstanding</div>
                    <div className="number">
                        {stats ? (
                            `$${formatNoDecimals(stats.loansOutstanding)}`
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Manager Funds</div>
                    <div className="number">
                        {stats ? (
                            `$${formatNoDecimals(stats.managerFunds)}`
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Max Pool Size</div>
                    <div className="number">
                        {stats ? (
                            `$${formatNoDecimals(stats.maxPoolSize)}`
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Loans</div>
                    <div className="number">
                        {stats ? stats.loans : <Skeleton width={30} />}
                    </div>
                </div>
            </div>
            <div className="stats large">
                <div className="stat">
                    <div className="label">Projected APY</div>
                    <div className="number">
                        {stats ? `${stats.apy}%` : <Skeleton width={70} />}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">Available for deposits</div>
                    <div className="number">
                        {stats ? (
                            `$${formatNoDecimals(stats.availableForDeposits)}`
                        ) : (
                            <Skeleton width={70} />
                        )}
                    </div>
                </div>
            </div>
        </Box>
    )
}
