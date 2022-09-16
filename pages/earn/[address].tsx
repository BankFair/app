import { BigNumber } from '@ethersproject/bignumber'
import type { NextPage } from 'next'
import Head from 'next/head'
import {
    FormEventHandler,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react'

import { useDispatch, useSelector } from '../../store'
import {
    APP_NAME,
    useAccount,
    useProvider,
    getAddress,
    zero,
    poolsConfig,
    prefix,
    TOKEN_SYMBOL,
    formatCurrency,
    formatToken,
    formatPercent,
    fetchLenderAccess,
    CHAIN_ID,
    chains,
} from '../../app'
import {
    Page,
    PoolStats,
    Box,
    PageLoading,
    Skeleton,
    useAmountForm,
    Button,
    ExitAlert,
    BackToPools,
    PoolInfo,
    Alert,
    InfoWithTooltip,
} from '../../components'
import {
    contract,
    Pool,
    useAccountInfo,
    useStatsState,
    trackTransaction,
} from '../../features'

const Earn: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const name =
        poolsConfig.find((pool) => pool.address === address)?.name || ''

    const title = name ? `${name} - ${APP_NAME}` : APP_NAME

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href={`${prefix}/favicon.svg`} />
        </Head>
    )

    // #region Account has access
    // Use empty string for a loading state, use `no` if user doesn't have access, use the account when they have access
    const [hasAccess, setHasAccess] = useState('')
    const account = useAccount()
    useEffect(() => {
        if (!account) {
            setHasAccess('no')
            return
        }

        setHasAccess('')
        fetchLenderAccess(account).then((hasAccess) => {
            setHasAccess(hasAccess ? account : 'no')
        })
    }, [account])
    // #endregion

    if (!pool || !hasAccess) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <BackToPools href="/" />
            <PoolInfo poolAddress={address} name={name} />
            <PoolStats pool={pool} poolAddress={address} />
            {!account || hasAccess === account ? (
                <Main>
                    <AddFunds pool={pool} poolAddress={address} />
                    <YourMoney pool={pool} poolAddress={address} />
                </Main>
            ) : (
                <Main>
                    <ApplyForLenderAccess pool={pool} poolAddress={address} />
                </Main>
            )}
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

function Main({ children }: { children: ReactNode }) {
    return (
        <div>
            <style jsx>{`
                div {
                    :global(h2) {
                        font-size: 16px;
                        margin: 0 0 16px;
                    }

                    > :global(.box) {
                        flex-basis: 50%;

                        > :global(.stats) {
                            > :global(.stat) {
                                margin-top: 8px;

                                > :global(.label) {
                                    color: var(--color-secondary);
                                    margin-bottom: 8px;
                                    font-size: 16px;
                                    font-weight: 400;
                                }
                                > :global(.value) {
                                    color: var(--color);
                                    font-size: 24px;
                                    font-weight: 700;
                                }
                            }
                        }
                    }

                    @media screen and (min-width: 800px) {
                        display: flex;

                        > :global(:first-child) {
                            margin-right: 8px;
                        }

                        > :global(:last-child) {
                            margin-left: 8px;
                        }

                        > :global(:first-child:last-child) {
                            margin-left: 0;
                            margin-right: 8px;
                        }
                    }
                    @media screen and (min-width: 950px) {
                        > :global(.box) {
                            > :global(.stats) {
                                display: flex;

                                > :global(.stat) {
                                    flex: 1 1 0;
                                }
                            }
                        }
                    }
                }
            `}</style>
            {children}
        </div>
    )
}

const estimatedAPYTooltip = (
    <InfoWithTooltip
        size={19}
        text="Snapshot of current return based APR of loans outstanding."
    />
)
function ApplyForLenderAccess({
    pool: { managerAddress },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const account = useAccount()

    const [stats] = useStatsState(poolAddress)

    const isManager = managerAddress === account

    const overlay = isManager ? "Manager can't deposit" : undefined

    return (
        <Box overlay={overlay ? overlay : null}>
            <h2>Apply for access to lend (takes 1 min)</h2>

            <div className="stats">
                <div className="stat">
                    <div className="label">
                        Estimated APY {estimatedAPYTooltip}
                    </div>
                    <div className="value">
                        {stats ? (
                            formatPercent(stats.apy / 100)
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: 8 }} />

            <Button
                href={`${
                    CHAIN_ID === chains.mumbai
                        ? `https://plcw7zwnspa.typeform.com/to/OBHwt5ow`
                        : `https://plcw7zwnspa.typeform.com/to/trkCl5gk`
                }#wallet_address=${account}`}
                target="_blank"
                style={{ padding: '0 24px' }}
            >
                Apply
            </Button>

            <div style={{ marginBottom: 16 }} />

            <Alert
                style="warning"
                title="This is an unaudited, size limited alpha proof of concept version. Please only add limited funds that you are prepared to lose. There is also limited liquidity to remove funds. Thank you for your support!"
            />
        </Box>
    )
}

function AddFunds({
    pool: { managerAddress, liquidityTokenAddress, liquidityTokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const account = useAccount()

    const [stats, refetchStats] = useStatsState(poolAddress)

    const [info, refetchAccountInfo] = useAccountInfo(poolAddress, account)

    const { max, cannotDeposit } = useMemo(() => {
        if (!stats) return { max: undefined, cannotDeposit: false }

        const amountDepositableBigNumber = BigNumber.from(
            stats.amountDepositable,
        )
        const cannotDeposit = amountDepositableBigNumber.eq(zero)

        return { max: amountDepositableBigNumber, cannotDeposit }
    }, [stats])

    const isManager = managerAddress === account

    const { form, allowance, balance } = useAmountForm({
        type: 'Deposit',
        onSumbit: (contract, amount) => contract.deposit(amount),
        refetch: () => Promise.all([refetchAccountInfo(), refetchStats()]),
        poolAddress,
        liquidityTokenAddress,
        liquidityTokenDecimals,
        disabled: Boolean(isManager || !stats || cannotDeposit),
        max,
    })

    const overlay = isManager
        ? "Manager can't deposit"
        : cannotDeposit
        ? "This pool doesn't accept deposits"
        : undefined

    return (
        <Box
            loading={Boolean(
                (account && !cannotDeposit ? !allowance || !balance : false) ||
                    stats === undefined,
            )}
            overlay={
                overlay ? (
                    <div>
                        {overlay}
                        {info && zero.lt(info.withdrawable) ? (
                            <div style={{ textAlign: 'center', marginTop: 8 }}>
                                <Button>Withdraw</Button>
                            </div>
                        ) : null}
                    </div>
                ) : null
            }
        >
            <h2>Add money</h2>

            <div className="stats">
                <div className="stat">
                    <div className="label">
                        Estimated APY {estimatedAPYTooltip}
                    </div>
                    <div className="value">
                        {stats ? (
                            formatPercent(stats.apy / 100)
                        ) : (
                            <Skeleton width={50} />
                        )}
                    </div>
                </div>
            </div>

            {form}

            <Alert
                style="warning"
                title="You should not deposit unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges"
            />
        </Box>
    )
}

function YourMoney({
    pool: { managerAddress, liquidityTokenAddress, liquidityTokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const account = useAccount()

    const [stats, refetchStats] = useStatsState(poolAddress)

    const [info, refetchAccountInfo] = useAccountInfo(poolAddress, account)

    const max = useMemo(
        () => (info ? BigNumber.from(info.withdrawable) : undefined),
        [info],
    )

    const isManager = managerAddress === account

    const { form, value } = useAmountForm({
        type: 'Withdraw',
        onSumbit: (contract, amount) => contract.withdraw(amount),
        refetch: () => Promise.all([refetchAccountInfo(), refetchStats()]),
        poolAddress,
        liquidityTokenAddress,
        liquidityTokenDecimals,
        disabled: Boolean(isManager || !stats),
        max,
    })

    return (
        <Box loading={Boolean(account ? !info : false)}>
            <h2>Your money</h2>

            <div className="stats">
                <div className="stat">
                    <div className="label">
                        Balance{' '}
                        <InfoWithTooltip
                            size={19}
                            text="Your funds in the Pool including any interested earned. Note that interest earned is only shown when Borrowers make repayments. Generally, this number will rise once a month, not everyday."
                        />
                    </div>
                    <div className="value">
                        {account ? (
                            info ? (
                                formatCurrency(
                                    info.balance,
                                    liquidityTokenDecimals,
                                )
                            ) : (
                                <Skeleton width={50} />
                            )
                        ) : (
                            '-'
                        )}
                    </div>
                </div>
                <div className="stat">
                    <div className="label">
                        Withdrawable{' '}
                        <InfoWithTooltip
                            size={19}
                            text="Funds that you can withdraw today. Dependant on how much un-loaned funds are in the pool at any one time."
                        />
                    </div>
                    <div className="value">
                        {account ? (
                            info ? (
                                formatCurrency(
                                    info.withdrawable,
                                    liquidityTokenDecimals,
                                )
                            ) : (
                                <Skeleton width={50} />
                            )
                        ) : (
                            '-'
                        )}
                    </div>
                </div>
            </div>

            {form}

            <ExitAlert
                value={value}
                verb="withdrawing"
                feePercent={stats ? stats.exitFeePercent : 0}
            />
        </Box>
    )
}

function Earnings({
    pool: { liquidityTokenDecimals },
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
                        formatToken(
                            earnings.amount,
                            liquidityTokenDecimals,
                        )}{' '}
                    {TOKEN_SYMBOL}
                </div>
                <Button
                    type="submit"
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
