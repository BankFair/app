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
    LoanViewOld,
    Page,
    PageLoading,
    Tabs,
    useAmountForm,
} from '../../components'
import {
    Pool,
    refetchStatsIfUsed,
    useLoans,
    useManagerInfo,
    useSigner,
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
                        <OldLoans pool={pool} poolAddress={address} />
                    </>
                ) : (
                    <h3>Login with manager wallet</h3>
                )
            ) : (
                <h3>Loading…</h3>
            )}

            <style jsx global>{`
                .page > .section {
                    max-width: 300px;
                    margin: 10px auto;
                    border: 1px solid grey;
                    border-radius: 8px;
                    text-align: center;
                    padding: 20px 0;

                    > h4 {
                        margin: 0 0 10px;
                    }

                    > table {
                        margin: 15px auto 0;
                    }
                }

                h3 {
                    text-align: center;
                }
            `}</style>
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
            s
            loading={Boolean(type === 'Unstake' && account ? !info : false)}
            overlay={isNotManager ? 'Only manager can stake' : undefined}
        >
            <Tabs tabs={types} currentTab={type} setCurrentTab={setType}></Tabs>

            {form}

            <EnterExitAlert
                enter={type === 'Stake'}
                value={value}
                exitVerb="unstaking"
                earlyExitDeadline={info ? info.earlyExitDeadline : 0}
                earlyExitFeePercent={stats ? stats.earlyExitFeePercent : 0}
            />
        </Box>
    )
}

function OldLoans({
    pool: { tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const loans = useLoans(poolAddress)
    const loansBlockNumber = useSelector(
        (s) => s.pools[poolAddress].loansBlockNumber,
    )
    const account = useAccount()
    const getContract = useSigner(poolAddress)

    const loading =
        !loansBlockNumber ||
        !getContract ||
        !account ||
        tokenDecimals === undefined

    const items = loading ? (
        <h3>Loading…</h3>
    ) : (
        loans
            .sort((a, b) => b.id - a.id)
            .map((loan) => (
                <LoanViewOld
                    key={loan.id}
                    loan={loan}
                    tokenDecimals={tokenDecimals}
                    getContract={getContract}
                    manage
                />
            ))
    )

    return (
        <div className="section">
            <h4>Loans</h4>
            {items}
        </div>
    )
}
