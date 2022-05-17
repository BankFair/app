import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import type { NextPage } from 'next'
import Head from 'next/head'
import {
    ChangeEvent,
    FormEventHandler,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useSelector } from '../../store'
import {
    APP_NAME,
    useAccount,
    useProvider,
    infiniteAllowance,
    getERC20Contract,
    getAddress,
    zero,
    POOLS,
    format,
} from '../../app'
import {
    Page,
    PoolStats,
    Steps,
    Box,
    Alert,
    Button,
    EtherscanLink,
    AmountInput,
    ConnectModal,
    PageLoading,
} from '../../components'
import {
    contract,
    Pool,
    useLoans,
    useAllowanceAndBalance,
    isAllowanceInfinite,
    useAmountDepositable,
} from '../../features'
import { useCallback } from 'react'

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
            <Deposit pool={pool} poolAddress={address} />
            <DepositOld pool={pool} poolAddress={address} />
            <Withdraw pool={pool} poolAddress={address} />
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

function Deposit({
    pool: { managerAddress, tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    // TODO: Check if account has borrowed

    const [loading, setLoading] = useState('')

    const provider = useProvider()

    const account = useAccount()
    const {
        allowance,
        balance,
        refetch: refetchAllowanceAndBalance,
    } = useAllowanceAndBalance(tokenAddress, poolAddress, account)
    const allowanceRef = useRef<string | undefined>()
    useEffect(() => {
        if (loading === 'allowance' && allowanceRef.current !== allowance) {
            setLoading('')
        }
        allowanceRef.current = allowance
    }, [loading, allowance])

    const [showConnectModal, setShowConnectModal] = useState(false)
    useEffect(() => {
        if (account) setShowConnectModal(false)
    }, [account])

    const [amountDepositable, refetchStats] = useAmountDepositable(poolAddress)
    const amountDepositableRef = useRef<string | undefined>(amountDepositable)
    useEffect(() => {
        if (
            loading === 'deposit' &&
            amountDepositableRef.current !== amountDepositable
        ) {
            setLoading('')
        }
        amountDepositableRef.current = amountDepositable
    }, [loading, amountDepositable])

    const { max, cannotDeposit } = useMemo(() => {
        if (!amountDepositable) return { max: null, cannotDeposit: true }

        const amountDepositableBigNumber = BigNumber.from(amountDepositable)
        const cannotDeposit = amountDepositableBigNumber.eq(zero)

        if (!balance) return { max: null, cannotDeposit }

        const balanceBigNumber = BigNumber.from(balance)
        const max = balanceBigNumber.gt(amountDepositableBigNumber)
            ? amountDepositableBigNumber
            : balanceBigNumber

        return { max, cannotDeposit }
    }, [amountDepositable, balance])

    const [amount, setAmount] = useState('')
    const { value, needsApproval } = useMemo(() => {
        const amountBigNumber = amount
            ? parseUnits(amount, tokenDecimals)
            : zero
        return {
            value: max?.lt(amountBigNumber)
                ? format(formatUnits(max, tokenDecimals))
                : amount,
            needsApproval: allowance
                ? BigNumber.from(allowance).lt(amountBigNumber)
                : false,
        }
    }, [max, tokenDecimals, amount, allowance])

    const handleClickMax = useCallback(() => {
        setAmount(format(formatUnits(max!, tokenDecimals)))
    }, [max, tokenDecimals])

    const isManager = managerAddress === account

    const disabled = Boolean(isManager || cannotDeposit || loading)

    return (
        <Box
            s
            loading={Boolean(
                (account ? !allowance || !balance : false) ||
                    amountDepositable === undefined,
            )}
            overlay={
                isManager
                    ? "Manager can't deposit"
                    : cannotDeposit
                    ? "This pool doesn't accept deposits"
                    : undefined
            }
        >
            <style jsx>{`
                .title {
                    > h3 {
                        margin: 0;
                        font-weight: 400;
                        font-size: 18px;
                        text-align: center;
                    }
                }

                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 12px 0;

                    > .input-container {
                        display: flex;
                        flex-direction: column;
                        margin-bottom: 8px;

                        > .max {
                            text-align: right;
                            font-size: 12px;
                            height: 14px;
                            line-height: 14px;
                            margin-bottom: 2px;
                            margin-right: 4px;

                            > span {
                                cursor: pointer;
                            }
                        }
                    }
                }
            `}</style>

            <div className="title">
                <h3>Deposit</h3>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault()

                    if (!account) {
                        setShowConnectModal(true)
                        return
                    }

                    const signer = provider!.getSigner()

                    if (needsApproval) {
                        setLoading('allowance')

                        getERC20Contract(tokenAddress)
                            .connect(signer)
                            .approve(poolAddress, infiniteAllowance)
                            .then((tx) => tx.wait())
                            .then(() => {
                                refetchAllowanceAndBalance()
                            })
                            .catch((reason) => {
                                console.error(reason)
                                setLoading('')
                            })

                        return
                    }

                    setLoading('deposit')

                    contract
                        .attach(poolAddress)
                        .connect(signer)
                        .deposit(parseUnits(value, tokenDecimals))
                        .then((tx) => tx.wait())
                        .then(() => {
                            refetchStats()
                        })
                        .catch((reason) => {
                            console.error(reason)
                            setLoading('')
                        })
                }}
            >
                <div className="input-container">
                    <div className="max">
                        {max ? (
                            <span onClick={handleClickMax}>
                                Max: {format(formatUnits(max, tokenDecimals))}
                            </span>
                        ) : null}
                    </div>
                    <AmountInput
                        decimals={6}
                        disabled={disabled}
                        value={value}
                        onChange={setAmount}
                    />
                </div>

                <Button
                    disabled={Boolean(disabled || (!value && account))}
                    type="submit"
                    width={170}
                    loading={Boolean(loading)}
                >
                    {account
                        ? needsApproval
                            ? 'Approve USDC'
                            : 'Deposit'
                        : 'Connect Wallet'}
                </Button>
            </form>

            <Alert style="warning" title="TODO: Explain the risks" />

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}
        </Box>
    )
}

function DepositOld({
    pool: { managerAddress, tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [value, setValue] = useState('100')
    const account = useAccount()
    const provider = useProvider()

    const isManager = managerAddress === account

    const [deposited, setDeposited] = useState('0')
    const ref = useRef<typeof account>(undefined)
    useEffect(() => {
        if (isManager) return
        if (ref.current === account) return
        ref.current = account

        if (!account) return

        contract
            .attach(poolAddress)
            .balanceOf(account)
            .then((amount) => {
                setDeposited(formatUnits(amount, tokenDecimals))
            })
    }, [account, tokenDecimals, poolAddress, isManager])

    const disabled = !account || !provider || isManager

    const noSubmit = disabled || isLoading

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noSubmit
        ? undefined
        : (event) => {
              event.preventDefault()
              setIsLoading(true)

              const amount = parseUnits(value, tokenDecimals)
              const signer = provider.getSigner()

              const attached = contract.attach(poolAddress)
              const tokenContract = getERC20Contract(tokenAddress)

              // TODO: Handle user cancelation
              attached.amountDepositable().then(async (depositableAmount) => {
                  if (amount.gt(depositableAmount)) {
                      alert(
                          `Maximum depositable amount is ${formatUnits(
                              depositableAmount,
                              tokenDecimals,
                          )}`,
                      ) // TODO: Display in component
                      setIsLoading(false)
                      return
                  }

                  const allowance = await tokenContract.allowance(
                      account,
                      poolAddress,
                  )
                  const tokenContractWithSigner = tokenContract.connect(signer)
                  const balance = await tokenContractWithSigner.balanceOf(
                      account,
                  )

                  if (balance.lt(amount)) {
                      alert('USDC balance too low') // TODO: Display in component
                      setIsLoading(false)
                      return
                  }

                  if (amount.gt(allowance)) {
                      const tx = await tokenContractWithSigner.approve(
                          poolAddress,
                          infiniteAllowance,
                      )

                      await tx.wait()
                  }

                  const tx = await attached.connect(signer).deposit(amount)

                  await tx.wait()

                  setDeposited((deposited) =>
                      formatUnits(
                          parseUnits(deposited, tokenDecimals).add(amount),
                          tokenDecimals,
                      ),
                  )

                  // TODO: In page notification

                  setIsLoading(false)
              })
          }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Deposit</h4>

            {managerAddress &&
                account &&
                (isManager ? (
                    <div>Manager can not deposit</div>
                ) : (
                    <div>You deposited {deposited}</div>
                ))}

            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={noSubmit}>Deposit</button>
        </form>
    )
}

function Withdraw({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [value, setValue] = useState('100')
    const loans = useLoans(poolAddress)
    const account = useAccount()
    const provider = useProvider()

    const isManager = managerAddress === account

    const [withdrawable, setWithdrawable] = useState('0')
    useEffect(() => {
        if (!account) return

        contract
            .attach(poolAddress)
            .amountWithdrawable(account)
            .then((value) => {
                setWithdrawable(formatUnits(value, tokenDecimals))
            })
    }, [
        setWithdrawable,
        account,
        tokenDecimals,
        loans,
        withdrawable,
        poolAddress,
    ])

    const disabled = !account || !provider || isManager

    const noSubmit = disabled || isLoading

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noSubmit
        ? undefined
        : (event) => {
              event.preventDefault()
              setIsLoading(true)

              const amount = parseUnits(value, tokenDecimals)

              const attached = contract.attach(poolAddress)

              // TODO: Handle user cancelation
              attached
                  .amountWithdrawable(account)
                  .then(async (withdrawableAmount) => {
                      if (amount.gt(withdrawableAmount)) {
                          alert(
                              `Maximum withdrawable amount is ${formatUnits(
                                  withdrawableAmount,
                                  tokenDecimals,
                              )}`,
                          ) // TODO: Display in component
                          setIsLoading(false)
                          return
                      }

                      const tx = await attached
                          .connect(provider.getSigner())
                          .withdraw(amount)

                      await tx.wait()

                      // TODO: In page notification

                      setIsLoading(false)

                      // TODO: Refresh staked

                      setWithdrawable(
                          formatUnits(
                              parseUnits(withdrawable, tokenDecimals).sub(
                                  amount,
                              ),
                              tokenDecimals,
                          ),
                      )
                  })
          }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Withdraw</h4>

            {managerAddress &&
                account &&
                (isManager ? (
                    <div>Manager can not withdraw</div>
                ) : (
                    <div>
                        Maximum withdrawable:{' '}
                        <a onClick={() => setValue(withdrawable)}>
                            {withdrawable}
                        </a>
                    </div>
                ))}

            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={noSubmit}>Withdraw</button>
        </form>
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
