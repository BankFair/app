import { formatUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import { useDispatch } from 'react-redux'
import { APP_NAME, formatNoDecimals, POOLS } from '../app'
import { LinkList, Page, Skeleton } from '../components'
import { useFetchIntervalAllStats, usePools } from '../features'

const title = `Earn - ${APP_NAME}`
const labels = ['Pool Size', 'Available for deposits', 'Projected APY', 'Loans']

const EarnPools: NextPage = () => {
    const pools = usePools()
    const dispatch = useDispatch()
    const poolsLoaded = Object.keys(pools).length === POOLS.length
    useFetchIntervalAllStats(poolsLoaded ? { dispatch } : null)

    return (
        <Page>
            <Head>
                <title>{title}</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <h1>Pools</h1>
            <LinkList
                items={POOLS.map(({ address, name }) => {
                    const pool = pools[address]
                    return {
                        link: `/earn/${address}`,
                        name: name,
                        stats:
                            pool && pool.stats
                                ? [
                                      `$${formatNoDecimals(
                                          formatUnits(
                                              pool.stats.poolFunds,
                                              pool.tokenDecimals,
                                          ),
                                      )}`,
                                      `$${formatNoDecimals(
                                          formatUnits(
                                              pool.stats.amountDepositable,
                                              pool.tokenDecimals,
                                          ),
                                      )}`,
                                      `${pool.stats.apy}%`,
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
