import { parseUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import { useMemo, useState } from 'react'
import { APP_NAME, useAccount, getAddress } from '../../app'
import {
    Box,
    EnterExitAlert,
    Loans,
    Page,
    PageLoading,
    Tabs,
    useAmountForm,
} from '../../components'
import {
    Pool,
    refetchStatsIfUsed,
    useManagerInfo,
    useStatsState,
} from '../../features'
import { useSelector } from '../../store'

const title = `Earn - ${APP_NAME}`

const Manage: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const account = useAccount()

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href="/favicon.ico" />
        </Head>
    )

    if (!pool) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <h1>{pool.name}</h1>
            {pool ? (
                pool.managerAddress === account ? (
                    <>
                        <StakeAndUnstake pool={pool} poolAddress={address} />
                        <Loans pool={pool} poolAddress={address} />
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

Manage.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Manage

const types = ['Stake', 'Unstake'] as const
function StakeAndUnstake({
    pool: { managerAddress, tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [type, setType] = useState<typeof types[number]>('Stake')

    const account = useAccount()

    const [stats] = useStatsState(poolAddress)
    const [info, refetchManagerInfo] = useManagerInfo(
        poolAddress,
        managerAddress,
    )

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
                ? (contract, amount) =>
                      contract.stake(parseUnits(amount, tokenDecimals))
                : (contract, amount) =>
                      contract.unstake(parseUnits(amount, tokenDecimals)),
        refetch: () =>
            Promise.all([
                refetchManagerInfo(),
                refetchStatsIfUsed(poolAddress),
            ]),
        poolAddress,
        tokenAddress,
        tokenDecimals,
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

            <EnterExitAlert
                enter={type === 'Stake'}
                value={value}
                enterVerb="stake"
                exitVerb="unstaking"
                earlyExitDeadline={info ? info.earlyExitDeadline : 0}
                earlyExitFeePercent={stats ? stats.earlyExitFeePercent : 0}
            />
        </Box>
    )
}
