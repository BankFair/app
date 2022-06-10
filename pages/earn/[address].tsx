import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from '../../store'
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
    PageLoading,
    Skeleton,
    useAmountForm,
    Tabs,
    Button,
    EnterExitAlert,
} from '../../components'
import {
    contract,
    Pool,
    useFetchIntervalAccountInfo,
    useAccountInfo,
    useStatsState,
    trackTransaction,
} from '../../features'

const Earn: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const name = POOLS.find((pool) => pool.address === address)?.name

    const title = name ? `${name} - ${APP_NAME}` : APP_NAME

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

            <h1>{name}</h1>
            <PoolStats pool={pool} poolAddress={address} />
            <DepositAndWithdraw pool={pool} poolAddress={address} />
            <YourSupply pool={pool} poolAddress={address} />
            <Earnings pool={pool} poolAddress={address} />
            {/* <div>
                Pool address: <EtherscanLink address={address} />
            </div> */}
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
    const [type, setType] = useState<typeof types[number]>('Deposit')

    const account = useAccount()

    const [isValidLender, setIsValidLender] = useState<
        [string, boolean] | null
    >(null)
    useEffect(() => {
        if (!account) return
        let canceled = false
        contract
            .attach(poolAddress)
            .isValidLender(account)
            .then((isValid) => {
                if (canceled) return
                setIsValidLender([account, isValid])
            })

        return () => {
            canceled = true
        }
    }, [account, poolAddress])

    const [stats, refetchStats] = useStatsState(poolAddress)

    const [info, refetchAccountInfo] = useAccountInfo(poolAddress, account)

    const { max, cannotDeposit } = useMemo(() => {
        if (type === 'Withdraw') {
            if (info) {
                return {
                    max: BigNumber.from(info.withdrawable),
                    cannotDeposit: false,
                }
            }

            return { max: undefined, cannotDeposit: false }
        }
        if (!stats) return { max: undefined, cannotDeposit: false }

        const amountDepositableBigNumber = BigNumber.from(
            stats.amountDepositable,
        )
        const cannotDeposit = amountDepositableBigNumber.eq(zero)

        return { max: amountDepositableBigNumber, cannotDeposit }
    }, [stats, type, info])

    const isManager = managerAddress === account

    const invalidLender =
        !isValidLender || isValidLender[0] !== account || !isValidLender[1]

    const { form, allowance, balance, value } = useAmountForm({
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
        disabled: Boolean(
            isManager || !stats || cannotDeposit || invalidLender,
        ),
        max,
    })

    const overlay = isManager
        ? "Manager can't deposit"
        : isValidLender && isValidLender[0] === account && invalidLender
        ? `Borrowers can't lend`
        : cannotDeposit
        ? "This pool doesn't accept deposits"
        : undefined

    return (
        <Box
            loading={Boolean(
                type === 'Deposit'
                    ? (account && !cannotDeposit
                          ? !allowance || !balance
                          : false) || stats === undefined
                    : account
                    ? !info
                    : false,
            )}
            overlay={
                overlay ? (
                    <div>
                        {overlay}
                        {info && zero.lt(info.withdrawable) ? (
                            <div style={{ textAlign: 'center', marginTop: 8 }}>
                                <Button onClick={() => setType('Withdraw')}>
                                    Withdraw
                                </Button>
                            </div>
                        ) : null}
                    </div>
                ) : null
            }
        >
            <Tabs tabs={types} currentTab={type} setCurrentTab={setType}></Tabs>

            {form}

            <EnterExitAlert
                enter={type === 'Deposit'}
                value={value}
                enterVerb="deposit"
                exitVerb="withdrawing"
                earlyExitDeadline={info ? info.earlyExitDeadline : 0}
                earlyExitFeePercent={stats ? stats.earlyExitFeePercent : 0}
            />
        </Box>
    )
}

function YourSupply({
    pool: { managerAddress, tokenDecimals },
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
        <Box>
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
    const dispatch = useDispatch()

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
    }, [account, poolAddress])

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
                      .then((tx) =>
                          trackTransaction(dispatch, {
                              name: 'Withdraw earnings',
                              tx,
                          }),
                      )
                      .then(() => {
                          setIsLoading(false)
                          setEarnings({
                              account: account!,
                              amount: BigNumber.from(0),
                          })
                      })
                      .catch((error) => {
                          console.error(error)
                          setIsLoading(false)
                      })
              }

    return (
        <Box>
            <style jsx>{`
                h4 {
                    margin-top: 0;
                    margin-bottom: 10px;
                    text-align: center;
                }
                div {
                    text-align: center;
                    margin-bottom: 8px;
                }

                form > :global(button) {
                    display: block;
                    margin: 0 auto;
                }
            `}</style>
            <form className="section" onSubmit={handleSubmit}>
                <h4>Earnings</h4>

                <div>
                    Your earnings:{' '}
                    {earnings &&
                        earnings.account === account &&
                        format(
                            formatUnits(earnings.amount, tokenDecimals),
                        )}{' '}
                    USDC
                </div>
                <Button
                    loading={isLoading}
                    disabled={
                        isLoading || earnings?.amount.lte(BigNumber.from(0))
                    }
                >
                    Withdraw
                </Button>
            </form>
        </Box>
    )
}
