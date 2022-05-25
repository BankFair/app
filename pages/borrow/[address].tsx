import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
    APP_NAME,
    format,
    getAddress,
    POOLS,
    rgbRed,
    useAccount,
    useProvider,
    zero,
} from '../../app'
import {
    AmountInput,
    Box,
    Button,
    ConnectModal,
    LoanView,
    Page,
    PageLoading,
} from '../../components'
import {
    contract,
    useLoadAccountLoans,
    useSigner,
    useTokenContractSigner,
    LoanStatus,
    Pool,
    useLoans,
    usePoolLiquidity,
    useBorrowConstraints,
    loanRequestedSignature,
} from '../../features'
import { useSelector } from '../../store'

const title = `Borrow - ${APP_NAME}`

const Borrow: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const name = POOLS.find((pool) => pool.address === address)?.name

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

            <h1>{name}</h1>
            <RequestLoan pool={pool} poolAddress={address} />
            <RequestLoanOld pool={pool} poolAddress={address} />
            <Loans pool={pool} poolAddress={address} />
        </Page>
    )
}

Borrow.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Borrow

const oneDay = 86400
const oneWeek = oneDay * 7
const oneYear = oneWeek * 52 + oneDay
const multipliers = [oneDay.toString(), oneWeek.toString(), oneYear.toString()]
const initialAmount = ''
const initialDuration = '4'
const initialDurationMultiplier = multipliers[1]
const initialDisplayAlert = false
function RequestLoan({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    // TODO: Check if user has already deposited in pool

    const account = useAccount()
    const provider = useProvider()

    const [displayAlert, setDisplayAlert] = useState(initialDisplayAlert)

    const [showConnectModal, setShowConnectModal] = useState(false)
    useEffect(() => {
        if (account) setShowConnectModal(false)
    }, [account])

    const loans = useLoans(poolAddress)
    const [loading, setLoading] = useState(0)

    const isLoanPendingApproval = useMemo(
        () =>
            account &&
            loading === 0 &&
            loans.filter(
                (loan) =>
                    loan.borrower === account &&
                    loan.status === LoanStatus.APPLIED,
            ).length,
        [account, loading, loans],
    )

    const borrowConstraints = useBorrowConstraints(poolAddress)

    const [amount, setAmount] = useState(initialAmount)
    const [max, refetch] = usePoolLiquidity(poolAddress)
    const maxElement = useMemo(
        () =>
            max ? (
                <span
                    onClick={() => {
                        setAmount(format(formatUnits(max, tokenDecimals)))
                        setDisplayAlert(true)
                    }}
                >
                    Max: {format(formatUnits(max, tokenDecimals))}
                </span>
            ) : null,
        [max, tokenDecimals],
    )
    const value = useMemo(() => {
        if (!max) return amount
        const maxBigNumber = BigNumber.from(max)

        return maxBigNumber.gt(
            amount ? parseUnits(amount, tokenDecimals) : zero,
        )
            ? amount
            : format(formatUnits(maxBigNumber, tokenDecimals))
    }, [max, amount, tokenDecimals])
    const isAmountTooLow = useMemo(
        () =>
            borrowConstraints &&
            value &&
            parseUnits(value, tokenDecimals).lt(borrowConstraints.minAmount),
        [borrowConstraints, tokenDecimals, value],
    )

    const [duration, setDuration] = useState(initialDuration)
    const [durationMultiplier, setDurationMultiplier] = useState(
        initialDurationMultiplier,
    )
    const durationInSeconds = Number(duration) * Number(durationMultiplier)
    const isDurationTooLow =
        borrowConstraints && durationInSeconds < borrowConstraints.minDuration
    const isDurationTooHigh =
        borrowConstraints && durationInSeconds > borrowConstraints.maxDuration

    useEffect(() => {
        if (!loading || loading === -1) return

        if (loans.filter((loan) => loan.id === loading).length) {
            setLoading(0)
            // #region reset
            // !!! Sync with region function
            setAmount(initialAmount)
            setDuration(initialDuration)
            setDurationMultiplier(initialDurationMultiplier)
            setDisplayAlert(initialDisplayAlert)
            // #endregion
        }
    }, [loans, loading])

    const { alert, willDisplayAlert } = useMemo(
        () => ({
            willDisplayAlert: isLoanPendingApproval || isAmountTooLow,
            alert:
                isLoanPendingApproval && displayAlert
                    ? 'A loan you requested is already pending approval'
                    : isAmountTooLow && displayAlert
                    ? `Minimum amount is ${format(
                          formatUnits(
                              BigNumber.from(borrowConstraints!.minAmount),
                              tokenDecimals,
                          ),
                      )}`
                    : isDurationTooLow
                    ? `Minimum duration is ${
                          borrowConstraints.minDuration / oneDay
                      } day`
                    : isDurationTooHigh
                    ? `Maximum duration is ${
                          borrowConstraints.maxDuration / oneYear
                      } years`
                    : null,
        }),
        [
            displayAlert,
            borrowConstraints,
            isAmountTooLow,
            isDurationTooHigh,
            isDurationTooLow,
            isLoanPendingApproval,
            tokenDecimals,
        ],
    )

    const isManager = managerAddress === account
    const componentIsLoading = !max || !borrowConstraints
    const disabled = isManager || componentIsLoading
    const waitingForTransaction = loading !== 0
    const disabledSubmit = Boolean(
        waitingForTransaction ||
            disabled ||
            !value ||
            alert ||
            willDisplayAlert,
    )
    const displayS = Number(duration) !== 1

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined =
        disabledSubmit
            ? undefined
            : (event) => {
                  event.preventDefault()

                  setLoading(-1)

                  const parsedAmount = parseUnits(value, tokenDecimals)
                  const parsedDuration = BigNumber.from(
                      Number(duration) * Number(durationMultiplier),
                  )

                  // TODO: Handle errors
                  // TODO: Handle user cancelation
                  contract
                      .attach(poolAddress)
                      .connect(provider!.getSigner())
                      .requestLoan(parsedAmount, parsedDuration)
                      .then((tx) => tx.wait())
                      .then((receipt) => {
                          let id = 0
                          for (const event of receipt.events || []) {
                              if (
                                  event.eventSignature ===
                                  loanRequestedSignature
                              ) {
                                  id = (event.args![0] as BigNumber).toNumber()
                                  break
                              }
                          }

                          return refetch().then(() => {
                              setLoading(id)
                              if (id === 0) {
                                  reset()
                              }
                          })
                      })
                      .catch((error) => {
                          console.error(error)
                          setLoading(0)
                          reset()
                      })

                  function reset() {
                      // !!! Sync with the reset region
                      setAmount(initialAmount)
                      setDuration(initialDuration)
                      setDurationMultiplier(initialDurationMultiplier)
                      setDisplayAlert(initialDisplayAlert)
                  }
              }

    return (
        <Box
            s
            loading={componentIsLoading}
            overlay={isManager ? `Manager can't request a loan` : undefined}
        >
            <style jsx>{`
                form {
                    > h3 {
                        text-align: center;
                        margin: 0 0 8px;
                    }

                    > table {
                        margin: 0 auto;
                        border-collapse: collapse;
                    }

                    .max {
                        text-align: right;
                        font-size: 12px;
                        height: 14px;
                        line-height: 14px;
                        margin-bottom: 2px;
                        margin-right: 4px;
                        color: var(--color-secondary);

                        > span {
                            cursor: pointer;
                        }
                    }

                    .amount-label {
                        padding-top: 17px;
                    }

                    .duration-label {
                        padding-top: 6px;
                        padding-right: 6px;
                    }

                    .duration {
                        padding-top: 6px;
                        display: flex;

                        > :global(.input) {
                            width: 46px;
                            margin-right: 6px;
                        }
                    }

                    .alert {
                        color: ${rgbRed};
                        font-size: 13px;
                        height: 15px;
                        margin: 8px 0;
                        text-align: center;
                        font-weight: 500;
                    }

                    > .button-container {
                        position: relative;
                        display: table;
                        margin: 0 auto;

                        > .clickable {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            cursor: not-allowed;
                        }
                    }
                }
            `}</style>
            <form onSubmit={handleSubmit}>
                <h3>Request Loan</h3>

                <table>
                    <tbody>
                        <tr>
                            <td className="amount-label">Amount</td>
                            <td>
                                <div className="max">{maxElement}</div>
                                <AmountInput
                                    decimals={tokenDecimals}
                                    value={value}
                                    onChange={setAmount}
                                    disabled={disabled}
                                    onBlur={() => setDisplayAlert(true)}
                                    onKeyDown={(event) =>
                                        event.key === 'Enter'
                                            ? setDisplayAlert(true)
                                            : undefined
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="duration-label">Duration</td>
                            <td className="duration">
                                <AmountInput
                                    decimals={4}
                                    value={duration}
                                    onChange={setDuration}
                                    disabled={disabled}
                                    noToken
                                    s
                                    center
                                />
                                <select
                                    className="s"
                                    value={durationMultiplier}
                                    onChange={(event) => {
                                        setDurationMultiplier(
                                            event.target.value,
                                        )
                                    }}
                                >
                                    <option value={multipliers[0]}>
                                        day{displayS ? 's' : ''}
                                    </option>
                                    <option value={multipliers[1]}>
                                        week{displayS ? 's' : ''}
                                    </option>
                                    <option value={multipliers[2]}>
                                        year{displayS ? 's' : ''}
                                    </option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="alert">{alert}</div>

                <div className="button-container">
                    <Button
                        disabled={disabledSubmit}
                        loading={waitingForTransaction}
                    >
                        {account ? 'Request Loan' : 'Connect Wallet'}
                    </Button>

                    {/* Disabled elements prevent any click events to be fired resulting in inputs not being blurred */}
                    {disabledSubmit ? <div className="clickable" /> : null}
                </div>
            </form>

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}
        </Box>
    )
}

function RequestLoanOld({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState('100')
    const [duration, setDuration] = useState('86400')
    const account = useAccount()
    const provider = useProvider()
    const loans = useLoans(poolAddress)

    const isManager = managerAddress === account
    const disabled = !account || !provider || isManager

    const noSubmit = disabled || isLoading

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined =
        disabled || isLoading
            ? undefined
            : (event) => {
                  event.preventDefault()

                  if (
                      loans.filter(
                          (loan) =>
                              loan.borrower === account &&
                              loan.status === LoanStatus.APPLIED,
                      ).length
                  ) {
                      // TODO: Display in component
                      alert(`A loan you requested is already pending approval`)
                      return
                  }

                  setIsLoading(true)

                  const parsedAmount = parseUnits(amount, tokenDecimals)
                  const parsedDuration = BigNumber.from(duration)

                  const attached = contract.attach(poolAddress)

                  Promise.all([
                      attached.minAmount(),
                      attached.minDuration(),
                      attached.maxDuration(),
                  ]).then(async ([minAmount, minDuration, maxDuration]) => {
                      if (parsedAmount.lt(minAmount)) {
                          // TODO: Display in component
                          alert(
                              `Amount must be higher than ${formatUnits(
                                  minAmount,
                                  tokenDecimals,
                              )}`,
                          )
                          setIsLoading(false)
                          return
                      }

                      if (parsedDuration.lt(minDuration)) {
                          // TODO: Display in component
                          alert(
                              `Amount must be higher than ${formatUnits(
                                  minDuration,
                                  tokenDecimals,
                              )}`,
                          )
                          setIsLoading(false)
                          return
                      }

                      if (parsedDuration.gt(maxDuration)) {
                          // TODO: Display in component
                          alert(
                              `Amount must be lower than ${formatUnits(
                                  maxDuration,
                                  tokenDecimals,
                              )}`,
                          )
                          setIsLoading(false)
                          return
                      }

                      // TODO: Handle errors
                      // TODO: Handle user cancelation
                      await attached
                          .connect(provider.getSigner())
                          .requestLoan(parsedAmount, parsedDuration)

                      // TODO: In page notification

                      setIsLoading(false)
                  })
              }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Request loan</h4>

            {isManager && <div>Manager can not request a loan</div>}

            <table>
                <tbody>
                    <tr>
                        <td>Amount</td>
                        <td>
                            <input
                                type="number"
                                inputMode="decimal"
                                onChange={(event) => {
                                    setAmount(event.target.value)
                                }}
                                value={amount}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Duration</td>
                        <td>
                            <input
                                type="number"
                                inputMode="decimal"
                                onChange={(event) => {
                                    setDuration(event.target.value)
                                }}
                                value={duration}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <button disabled={noSubmit}>Request loan</button>
        </form>
    )
}

function Loans({ pool, poolAddress }: { pool: Pool; poolAddress: string }) {
    const getContract = useSigner(poolAddress)
    const getTokenContractSigner = useTokenContractSigner(pool.tokenAddress)
    const account = useAccount()
    const allLoans = useLoans(poolAddress)
    const loans = useMemo(
        () =>
            allLoans
                .filter((loan) => loan.borrower === account)
                .sort((a, b) => b.id - a.id),
        [account, allLoans],
    )
    const dispatch = useDispatch()

    useLoadAccountLoans(poolAddress, account, dispatch, pool)

    if (!account || !getTokenContractSigner) return null

    const { tokenDecimals } = pool

    return (
        <div className="section">
            <h4>Your loans</h4>

            {loans.map((loan) => (
                <LoanView
                    key={loan.id}
                    loan={loan}
                    account={account}
                    tokenDecimals={tokenDecimals}
                    poolAddress={poolAddress}
                    dispatch={dispatch}
                    getContract={getContract}
                    borrow={getTokenContractSigner}
                    hideBorrower
                />
            ))}
        </div>
    )
}
