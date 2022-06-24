import { formatUnits } from 'ethers/lib/utils'
import { NextPage } from 'next'
import Head from 'next/head'
import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { APP_NAME, formatNoDecimals, POOLS, useAccount } from '../../app'
import { PoolsList, Page, PageLoading, Skeleton } from '../../components'
import { useFetchIntervalAllStats, usePools } from '../../features'

const title = `Earn - ${APP_NAME}`
const labels = ['Pool size', 'Manager funds', 'Avialable liquidity', 'Loans']
const ManagePools: NextPage = () => {
    const account = useAccount()
    const allPools = usePools()
    const allPoolsLoaded = Object.keys(allPools).length === POOLS.length
    const pools = useMemo(
        () =>
            Object.values(allPools).filter(
                (pool) => pool.managerAddress === account,
            ),
        [allPools, account],
    )
    const dispatch = useDispatch()
    useFetchIntervalAllStats(pools.length ? { dispatch, pools } : null)

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href="/favicon.svg" />
        </Head>
    )

    if (!account) {
        return (
            <h3 style={{ textAlign: 'center' }}>
                Connect your wallet to continue
            </h3>
        )
    }

    if (allPoolsLoaded && pools.length === 0) {
        return (
            <h3 style={{ textAlign: 'center' }}>
                You&apos;re not the manager of any pools
            </h3>
        )
    }

    if (!allPoolsLoaded) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <h1>Pools</h1>
            <PoolsList
                items={pools.map((pool) => {
                    return {
                        link: `/manage/${pool.address}`,
                        name: pool.name,
                        stats: pool.stats
                            ? [
                                  `$${formatNoDecimals(
                                      formatUnits(
                                          pool.stats.poolFunds,
                                          pool.tokenDecimals,
                                      ),
                                  )}`,
                                  `$${formatNoDecimals(
                                      formatUnits(
                                          pool.stats.balanceStaked,
                                          pool.tokenDecimals,
                                      ),
                                  )}`,
                                  `$${formatNoDecimals(
                                      formatUnits(
                                          pool.stats.poolLiquidity,
                                          pool.tokenDecimals,
                                      ),
                                  )}`,
                                  pool.stats.loans.toString(),
                              ]
                            : [
                                  <Skeleton key="1" width={50} />,
                                  <Skeleton key="2" width={50} />,
                                  <Skeleton key="3" width={50} />,
                                  <Skeleton key="4" width={30} />,
                              ],
                    }
                })}
                labels={labels}
            />
        </Page>
    )
}

export default ManagePools
