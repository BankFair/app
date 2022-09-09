import { NextPage } from 'next'
import Head from 'next/head'
import { useDispatch } from 'react-redux'
import { APP_NAME, formatCurrency, POOLS, prefix } from '../app'
import { Page, Skeleton, PoolsListNew } from '../components'
import { useFetchIntervalAllStats, usePools } from '../features'

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
    const poolsLoaded = Object.keys(pools).length === POOLS.length
    useFetchIntervalAllStats(poolsLoaded ? { dispatch } : null)

    return (
        <Page>
            <Head>
                <title>{title}</title>
                <link rel="icon" href={`${prefix}/favicon.svg`} />
            </Head>

            <h1>Pools</h1>
            <PoolsListNew
                showMoreAndOpenPage
                items={POOLS.map(({ address, name, description }) => {
                    const pool = pools[address]
                    return {
                        link: `/earn/${address}`,
                        name: name,
                        description,
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
