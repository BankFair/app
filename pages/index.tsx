import { formatUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import {
    APP_NAME,
    formatFloor,
    POOLS,
    rgbTextPrimary,
    shadow,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH,
} from '../app'
import { Page, Skeleton } from '../components'
import { useFetchIntervalStats, usePool } from '../features'

const title = `Earn - ${APP_NAME}`

const EarnPools: NextPage = () => {
    return (
        <Page>
            <Head>
                <title>{title}</title>
                <meta
                    name="description"
                    content="" // TODO: Fix
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <ul>
                <style jsx>{`
                    ul {
                        list-style: none;
                        margin: 0;
                        padding: 0;
                    }
                `}</style>
                {POOLS.map((pool) => (
                    <Pool key={pool.address} pool={pool} />
                ))}
            </ul>
        </Page>
    )
}

function Pool({ pool: { address, name } }: { pool: typeof POOLS[number] }) {
    const pool = usePool(address)

    useFetchIntervalStats(pool ? address : null)

    return (
        <li>
            <style jsx>{`
                a {
                    color: ${rgbTextPrimary};
                    display: flex;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 10px 0;
                    justify-content: space-between;
                    background-color: white;
                    box-shadow: ${shadow} 0 1px 2px 0;
                    flex-direction: column;
                }

                h4 {
                    margin: 0 0 8px;
                    font-size: 18px;
                    font-weight: 500;
                }

                .stats {
                    display: flex;
                    text-align: center;
                    flex-wrap: wrap;
                    align-items: center;

                    > .stat {
                        flex-basis: 50%;
                        margin-top: 8px;

                        > .label {
                            font-size: 10px;
                            text-transform: uppercase;
                            margin-bottom: 4px;
                        }
                        > .value {
                            font-size: 18px;
                        }
                    }
                }

                @media screen and (min-width: 530px) {
                    a {
                        flex-direction: row;
                        align-items: center;
                    }

                    h4 {
                        margin: 0;
                    }
                }

                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .stats {
                        width: 200px;
                        display: flex;
                    }
                }

                @media screen and (min-width: 900px) {
                    .stats {
                        width: auto;
                        flex-wrap: nowrap;

                        > .stat {
                            flex-basis: auto;
                            margin: 0 6px;
                            > .label {
                                height: auto;
                            }
                        }
                    }
                }
            `}</style>
            <Link href={`/earn/${address}`}>
                <a>
                    <h4>{name}</h4>

                    <div className="stats">
                        <div className="stat">
                            <div className="label">Pool Size</div>
                            <div className="value">
                                {pool && pool.stats ? (
                                    `$${formatFloor(
                                        formatUnits(
                                            pool.stats.poolFunds,
                                            pool.tokenDecimals,
                                        ),
                                    )}`
                                ) : (
                                    <Skeleton width={50} />
                                )}
                            </div>
                        </div>
                        <div className="stat">
                            <div className="label">Available for deposits</div>
                            <div className="value">
                                {pool && pool.stats ? (
                                    `$${formatFloor(
                                        formatUnits(
                                            pool.stats.amountDepositable,
                                            pool.tokenDecimals,
                                        ),
                                    )}`
                                ) : (
                                    <Skeleton width={50} />
                                )}
                            </div>
                        </div>
                        <div className="stat">
                            <div className="label">Projected APY</div>
                            <div className="value">0%</div>
                        </div>
                        <div className="stat">
                            <div className="label">Loans</div>
                            <div className="value">
                                {pool && pool.stats ? (
                                    pool.stats.loans
                                ) : (
                                    <Skeleton width={30} />
                                )}
                            </div>
                        </div>
                    </div>
                </a>
            </Link>
        </li>
    )
}

export default EarnPools
