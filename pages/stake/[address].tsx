import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    APP_NAME,
    useAccount,
    getAddress,
    prefix,
} from '../../app'
import {
    Alert,
    BackToPools,
    Box,
    ExitAlert,
    Page,
    PageLoading,
    Tabs,
    useAmountForm,
} from '../../components'
import {
    fetchBorrowInfo,
    Pool,
    refetchStatsIfUsed,
    useManagerInfo,
    useStatsState,
} from '../../features'
import { useDispatch, useSelector } from '../../store'

const title = `Stake - ${APP_NAME}`

const Stake: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const account = useAccount()

    const dispatch = useDispatch()
    const dispatchRef = useRef('')
    useEffect(() => {
        if (!pool) return
        if (dispatchRef.current === address) return
        dispatchRef.current = address
        dispatch(
            fetchBorrowInfo({
                poolAddress: address,
                loanDeskAddress: pool.loanDeskAddress,
            }),
        )
    }, [address, dispatch, pool])

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href={`${prefix}/favicon.svg`} />
        </Head>
    )

    if (!pool || !pool.borrowInfo) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <BackToPools href="/stake" />
            <h1>{pool.name}</h1>
            {pool ? (
                pool.managerAddress === account ? (
                    <>
                        <StakeAndUnstake
                            pool={pool}
                            poolAddress={address}
                            account={account}
                        />
                    </>
                ) : (
                    <h3>Login with manager wallet</h3>
                )
            ) : (
                <h3>Loading…</h3>
            )}
        </Page>
    )
}

Stake.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Stake

const types = ['Stake', 'Unstake'] as const
function StakeAndUnstake({
    pool: { managerAddress, liquidityTokenAddress, liquidityTokenDecimals },
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string
}) {
    const [type, setType] = useState<typeof types[number]>('Stake')

    const [stats] = useStatsState(poolAddress)
    const [info, refetchManagerInfo] = useManagerInfo(poolAddress)

    const max = useMemo(() => {
        if (type === 'Stake') return undefined

        if (info) return BigNumber.from(info.unstakable)

        return undefined
    }, [type, info])

    const isNotManager = managerAddress !== account

    const { form, value } = useAmountForm({
        type,
        onSumbit:
            type === 'Stake'
                ? (contract, amount) => contract.stake(amount)
                : (contract, amount) => contract.unstake(amount),
        refetch: () =>
            Promise.all([
                refetchManagerInfo(),
                refetchStatsIfUsed(poolAddress),
            ]),
        poolAddress,
        liquidityTokenAddress,
        liquidityTokenDecimals,
        disabled: Boolean(isNotManager),
        max,
    })

    return (
        <Box
            loading={Boolean(type === 'Unstake' && account ? !info : false)}
            overlay={isNotManager ? 'Only manager can stake' : undefined}
        >
            <Tabs tabs={types} currentTab={type} setCurrentTab={setType}></Tabs>

            {form}

            {type === 'Stake' ? (
                <Alert
                    style="warning"
                    title="You should not stake unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges"
                />
            ) : (
                <ExitAlert
                    value={value}
                    verb="unstaking"
                    feePercent={stats ? stats.exitFeePercent : 0}
                />
            )}
        </Box>
    )
}
