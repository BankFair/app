import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useMemo, useState } from 'react'
import { useSelector } from '../../store'
import {
    APP_NAME,
    useAccount,
    useProvider,
    getAddress,
    zero,
    POOLS,
    format,
} from '../../app'
import {
    Page,
    PoolStats,
    Box,
    Alert,
    EtherscanLink,
    PageLoading,
    Skeleton,
    useAmountForm,
    Tabs,
} from '../../components'
import {
    contract,
    Pool,
    useAmountDepositable,
    useFetchIntervalAccountInfo,
    useAccountInfo,
} from '../../features'

const Earn: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const name = POOLS.find((pool) => pool.address === address)?.name

    const title = `${name} - ${APP_NAME}`

    const head = (
        <Head>
            <title>{title}</title>
            <meta
                name="description"
                content="" // TODO: Fix
            />
            <link rel="icon" href="/favicon.ico" />
        </Head>
    )

    if (!pool) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}
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

                    table {
                        margin: 0 auto;
                    }

                    h3 {
                        text-align: center;
                    }
                }
            `}</style>

            <h1>{name}</h1>
            <PoolStats pool={pool} poolAddress={address} />
            <DepositAndWithdraw pool={pool} poolAddress={address} />
            <YourSupply pool={pool} poolAddress={address} />
            <Earnings pool={pool} poolAddress={address} />
            <div>
                Pool address: <EtherscanLink address={address} />
            </div>
        </Page>
    )
}

Earn.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Earn

const types = ['Deposit', 'Withdraw'] as const
function DepositAndWithdraw({
    pool: { managerAddress, tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    // TODO: Check if account has borrowed
    const [type, setType] = useState<typeof types[number]>('Deposit')

    const account = useAccount()

    const [amountDepositable, refetchStats] = useAmountDepositable(poolAddress)

    const [info, refetchAccountInfo] = useAccountInfo(poolAddress, account)

    const { max, cannotDeposit } = useMemo(() => {
        if (type === 'Withdraw') {
            if (info)
                return {
                    max: BigNumber.from(info.withdrawable),
                    cannotDeposit: false,
                }

            return { max: undefined, cannotDeposit: false }
        }
        if (!amountDepositable) return { max: undefined, cannotDeposit: true }

        const amountDepositableBigNumber = BigNumber.from(amountDepositable)
        const cannotDeposit = amountDepositableBigNumber.eq(zero)

        return { max: amountDepositableBigNumber, cannotDeposit }
    }, [amountDepositable, type, info])

    const isManager = managerAddress === account

    const { form, allowance, balance } = useAmountForm({
        type,
        onSumbit:
            type === 'Deposit'
                ? (contract, amount) =>
                      contract.deposit(parseUnits(amount, tokenDecimals))
                : (contract, amount) =>
                      contract.withdraw(parseUnits(amount, tokenDecimals)),
        refetch: () => Promise.all([refetchAccountInfo(), refetchStats()]),
        poolAddress,
        tokenAddress,
        tokenDecimals,
        disabled: Boolean(isManager || cannotDeposit),
        max,
    })

    return (
        <Box
            s
            loading={Boolean(
                type === 'Deposit'
                    ? (account && !cannotDeposit
                          ? !allowance || !balance
                          : false) || amountDepositable === undefined
                    : account
                    ? !info
                    : false,
            )}
            overlay={
                // TODO: While the pool doesn't accept deposits a user may want to withdraw
                isManager
                    ? "Manager can't deposit"
                    : cannotDeposit
                    ? "This pool doesn't accept deposits"
                    : undefined
            }
        >
            <Tabs tabs={types} currentTab={type} setCurrentTab={setType}></Tabs>

            {form}

            <Alert style="warning" title="TODO: Explain the risks" />
        </Box>
    )
}

function YourSupply({
    pool: { managerAddress, tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const account = useAccount()

    useFetchIntervalAccountInfo(account ? { poolAddress, account } : null)

    const info = useSelector((state) =>
        account ? state.pools[poolAddress]?.accountInfo[account] : null,
    )

    if (!account || account === managerAddress) return null

    return (
        <Box s>
            <div>
                Your deposit:{' '}
                {info ? (
                    `$${format(formatUnits(info.balance, tokenDecimals))}`
                ) : (
                    <Skeleton width={35} />
                )}
            </div>
            <div>
                Withdrawable:{' '}
                {info ? (
                    `$${format(formatUnits(info.withdrawable, tokenDecimals))}`
                ) : (
                    <Skeleton width={35} />
                )}
            </div>
        </Box>
    )
}

function Earnings({
    pool: { tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [earnings, setEarnings] = useState<{
        amount: BigNumber
        account: string
    } | null>(null)
    const account = useAccount()
    const provider = useProvider()

    useEffect(() => {
        if (!account) return
        contract
            .attach(poolAddress)
            .protocolEarningsOf(account)
            .then((earnings) => {
                if (!earnings.gt(BigNumber.from(0))) return
                setEarnings({
                    amount: earnings,
                    account,
                })
            })
    }, [account, setEarnings, poolAddress])

    if (!earnings || !provider) return null

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined =
        isLoading
            ? undefined
            : (event) => {
                  event.preventDefault()

                  setIsLoading(true)
                  contract
                      .attach(poolAddress)
                      .connect(provider.getSigner())
                      .withdrawProtocolEarnings()
                      .then((tx) => {
                          return tx.wait()
                      })
                      .then(() => {
                          setIsLoading(false)
                          setEarnings({
                              account: account!,
                              amount: BigNumber.from(0),
                          })
                      })
              }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Earnings</h4>

            <div>
                Your earnings:{' '}
                {earnings &&
                    earnings.account === account &&
                    formatUnits(earnings.amount, tokenDecimals)}
            </div>
            <button
                disabled={isLoading || earnings?.amount.lte(BigNumber.from(0))}
            >
                Withdraw
            </button>
        </form>
    )
}
