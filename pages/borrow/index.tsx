import { formatUnits } from 'ethers/lib/utils'
import { NextPage } from 'next'
import Head from 'next/head'
import { useDispatch } from 'react-redux'
import { APP_NAME, formatNoDecimals, POOLS, prefix } from '../../app'
import { PoolsList, Page, Skeleton, PoolsListNew } from '../../components'
import {
    useFetchIntervalAllBorrowInfo,
    useFetchIntervalAllStats,
    usePools,
} from '../../features'

const title = `Borrow - ${APP_NAME}`
const labels = ['Available liquidity', 'Interest rate']

const BorrowPools: NextPage = () => {
    const pools = usePools()
    const dispatch = useDispatch()
    const poolsLoaded = Object.keys(pools).length === POOLS.length
    const hookArg = poolsLoaded ? { dispatch } : null
    useFetchIntervalAllStats(hookArg)
    useFetchIntervalAllBorrowInfo(hookArg && dispatch)

    return (
        <Page>
            <Head>
                <title>{title}</title>
                <link rel="icon" href={`${prefix}/favicon.svg`} />
            </Head>

            <h1>Pools</h1>
            <PoolsListNew
                items={POOLS.map(({ address, name }) => {
                    const pool = pools[address]
                    return {
                        link: `/borrow/${address}`,
                        name,
                        stats:
                            pool && pool.stats && pool.borrowInfo
                                ? [
                                      `$${formatNoDecimals(
                                          formatUnits(
                                              pool.stats.poolLiquidity,
                                              pool.tokenDecimals,
                                          ),
                                      )}`,
                                      `${pool.borrowInfo.apr}%`,
                                  ]
                                : [
                                      <Skeleton key="1" width={50} />,
                                      <Skeleton key="2" width={30} />,
                                  ],
                    }
                })}
                labels={labels}
            />
        </Page>
    )
}

export default BorrowPools
