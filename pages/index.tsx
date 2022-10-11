import { NextPage } from 'next'
import Head from 'next/head'
import {useDispatch, useSelector} from 'react-redux'
import {
    APP_NAME,
    formatCurrency,
    formatPercent,
    poolsConfig,
    prefix, SIDEBAR_ALWAYS_VISIBLE_WIDTH, useAccount,
} from '../app'
import { Page, Skeleton, PoolsListNew } from '../components'
import {selectPools, useFetchIntervalAllStats, usePools} from '../features'
import Link from "next/link";
import {RiHandCoinLine, RiVipDiamondLine} from "react-icons/ri";
import {useMemo} from "react";
import {SIDEBAR_MAX_WIDTH} from "../components/navigation/constants";

const title = `Earn - ${APP_NAME}`
const labels = [
    'Total Pool Size',
    'Available for deposits',
    'Projected APY',
    'Loans',
]

const EarnPools: NextPage = () => {
    const pools = usePools()
    const dispatch = useDispatch()
    const poolsLoaded = Object.keys(pools).length === poolsConfig.length
    useFetchIntervalAllStats(poolsLoaded ? { dispatch } : null)

    const account = useAccount()
    const isManager = useMemo(
        () =>
            Object.values(pools).filter(
                (pool) => pool.managerAddress === account,
            ).length > 0,
        [pools, account],
    )

    return (
        <Page>
            <style jsx>{`
                .navlinks {
                  display: block;
                }
                a {
                    width: 50%;
                    color: var(--greenery);
                    font-weight: 600;
                    font-size: 16px;
                    
                    display: inline-block;
                    cursor: pointer;
                    line-height: 24px;
                    
                    > :global(svg) {
                        margin-right: 8px;
                    }
                }
                
                @media screen and (min-width: ${SIDEBAR_ALWAYS_VISIBLE_WIDTH}px) {
                    .navlinks {
                      display: none;
                    }
                }
            `}</style>

            <Head>
                <title>{title}</title>
                <link rel="icon" href={`${prefix}/favicon.svg`} />
            </Head>

            <h1>Earn: Pools Open to Lenders</h1>
            <span className={'navlinks'}>
                <Link href="/borrow">
                    <a>
                        <RiHandCoinLine size={18} />
                        Borrow
                    </a>
                </Link>
                {isManager && (
                    <Link href="/manage">
                        <a>
                            <RiVipDiamondLine size={18} />
                            Manage
                        </a>
                    </Link>
                )}
            </span>

            <PoolsListNew
                showMoreAndOpenPage
                items={poolsConfig.map(({ address, name }) => {
                    const pool = pools[address]
                    return {
                        address,
                        link: `/earn/${address}`,
                        name: name,
                        stats:
                            pool && pool.stats
                                ? [
                                      formatCurrency(
                                          pool.stats.poolFunds,
                                          pool.liquidityTokenDecimals,
                                          0,
                                      ),
                                      formatCurrency(
                                          pool.stats.amountDepositable,
                                          pool.liquidityTokenDecimals,
                                          0,
                                      ),
                                      formatPercent(pool.stats.apy / 100),
                                      pool.stats.loans.toString(),
                                  ]
                                : [
                                      <Skeleton key="1" width={50} />,
                                      <Skeleton key="2" width={50} />,
                                      <Skeleton key="3" width={30} />,
                                      <Skeleton key="4" width={30} />,
                                  ],
                    }
                })}
                labels={labels}
            />
        </Page>
    )
}

export default EarnPools
