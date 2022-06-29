import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useMemo, useState } from 'react'

import {
    APP_NAME,
    format,
    getAddress,
    oneHundredPercent,
    POOLS,
    prefix,
    TOKEN_SYMBOL,
    useAccount,
    useProvider,
    withInterest,
    zero,
} from '../../app'
import {
    Alert,
    AmountInput,
    BackToPools,
    Box,
    Button,
    ConnectModal,
    Loans,
    Page,
    PageLoading,
} from '../../components'
import {
    contract,
    LoanStatus,
    Pool,
    useLoans,
    usePoolLiquidity,
    useBorrowInfo,
    loanRequestedSignature,
    trackTransaction,
} from '../../features'
import { useDispatch, useSelector } from '../../store'

const title = `Borrow - ${APP_NAME}`

const Borrow: NextPage<{ address: string }> = ({ address }) => {
    const account = useAccount()
    const pool = useSelector((s) => s.pools[address])
    const name = POOLS.find((pool) => pool.address === address)?.name

    const head = (
        <Head>
            <title>{title}</title>
                <link rel="icon" href={`${prefix}/favicon.svg`} />
        </Head>
    )

    if (!pool) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <BackToPools href='/borrow' />
            <h1>{name}</h1>
            <RequestLoan pool={pool} poolAddress={address} account={account} />
            <Loans pool={pool} poolAddress={address} account={account} />
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
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string | undefined
}) {
    const provider = useProvider()

    const dispatch = useDispatch()

    const [isValidBorrower, setIsValidBorrower] = useState<
        [string, boolean] | null
    >(null)
    useEffect(() => {
        if (!account) return
        let canceled = false
        contract
            .attach(poolAddress)
            .isValidBorrower(account)
            .then((isValid) => {
                if (canceled) return
                setIsValidBorrower([account, isValid])
            })

        return () => {
            canceled = true
        }
    }, [account, poolAddress])

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

    const borrowInfo = useBorrowInfo(poolAddress)

    const [amount, setAmount] = useState(initialAmount)
    const [max, refetch] = usePoolLiquidity(poolAddress)
    const { maxElement, canRequest } = useMemo(() => {
        if (!max || !borrowInfo) return { maxElement: null, canRequest: false }

        const maxBigNumber = BigNumber.from(max)
        const maxFormatted = format(formatUnits(maxBigNumber, tokenDecimals))

        return {
            maxElement: max ? (
                <span
                    tabIndex={0}
                    onClick={() => {
                        setAmount(maxFormatted)
                        setDisplayAlert(true)
                    }}
                >
                    Max: {maxFormatted}
                </span>
            ) : null,
            canRequest: maxBigNumber.gte(borrowInfo.minLoanAmount),
        }
    }, [borrowInfo, max, tokenDecimals])
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
            borrowInfo &&
            value &&
            parseUnits(value, tokenDecimals).lt(borrowInfo.minLoanAmount),
        [borrowInfo, tokenDecimals, value],
    )

    const [duration, setDuration] = useState(initialDuration)
    const [durationMultiplier, setDurationMultiplier] = useState(
        initialDurationMultiplier,
    )

    const durationInSeconds = Number(duration) * Number(durationMultiplier)
    const isDurationTooLow =
        borrowInfo && durationInSeconds < borrowInfo.minLoanDuration
    const isDurationTooHigh =
        borrowInfo && durationInSeconds > borrowInfo.maxLoanDuration

    function reset() {
        setAmount(initialAmount)
        setDuration(initialDuration)
        setDurationMultiplier(initialDurationMultiplier)
        setDisplayAlert(initialDisplayAlert)
    }

    useEffect(() => {
        if (!loading || loading === -1) return

        if (loans.filter((loan) => loan.id === loading).length) {
            setLoading(0)
            reset()
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
                              BigNumber.from(borrowInfo!.minLoanAmount),
                              tokenDecimals,
                          ),
                      )}`
                    : isDurationTooLow
                    ? `Minimum duration is ${
                          borrowInfo.minLoanDuration / oneDay
                      } day`
                    : isDurationTooHigh
                    ? `Maximum duration is ${
                          borrowInfo.maxLoanDuration / oneYear
                      } years`
                    : null,
        }),
        [
            displayAlert,
            borrowInfo,
            isAmountTooLow,
            isDurationTooHigh,
            isDurationTooLow,
            isLoanPendingApproval,
            tokenDecimals,
        ],
    )

    const willOwe = useMemo(() => {
        if (!borrowInfo) return '0'

        return format(
            formatUnits(
                withInterest(
                    parseUnits(value || '0', tokenDecimals),
                    BigNumber.from((borrowInfo.apr / 100) * oneHundredPercent),
                    durationInSeconds / oneDay,
                ),
                tokenDecimals,
            ),
        )
    }, [borrowInfo, durationInSeconds, value, tokenDecimals])

    const isManager = managerAddress === account
    const componentIsLoading = !max || !borrowInfo
    const disabled = isManager || componentIsLoading
    const waitingForTransaction = loading !== 0
    const invalidBorrower =
        !isValidBorrower ||
        isValidBorrower[0] !== account ||
        !isValidBorrower[1]
    const disabledSubmit = Boolean(
        invalidBorrower ||
            waitingForTransaction ||
            disabled ||
            !value ||
            !canRequest ||
            alert ||
            willDisplayAlert,
    )
    const displayS = Number(duration) !== 1

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = account
        ? disabledSubmit
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
                      .then((tx) =>
                          trackTransaction(dispatch, {
                              name: `Request loan for ${value} ${TOKEN_SYMBOL}`,
                              tx,
                          }),
                      )
                      .then(({ payload: { receipt } }) => {
                          if (!receipt) {
                              setLoading(0)
                              reset()
                              return
                          }

                          let id = 0
                          for (const event of receipt.events || []) {
                              if (
                                  event.eventSignature ===
                                  loanRequestedSignature
                              ) {
                                  id = BigNumber.from(
                                      event.args!.array[0],
                                  ).toNumber()
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
              }
        : (event) => {
              event.preventDefault()
              setShowConnectModal(true)
          }

    return (
        <Box
            loading={componentIsLoading}
            overlay={
                isManager
                    ? `Manager can't request a loan`
                    : isValidBorrower &&
                      isValidBorrower[0] === account &&
                      invalidBorrower
                    ? `Lenders can't borrow`
                    : !canRequest
                    ? 'There is not enough liquidity in the pool to request a loan'
                    : undefined
            }
        >
            <style jsx>{`
                form {
                    > h3 {
                        margin: 0 0 8px;
                    }

                    > table {
                        border-collapse: collapse;
                    }

                    .max {
                        font-size: 14px;
                        font-weight: 500;
                        height: 16px;
                        line-height: 16px;
                        color: var(--color-secondary);

                        > :global(span) {
                            cursor: pointer;
                        }
                    }

                    td {
                        padding: 3px 0;
                    }

                    .amount-label {
                        padding-right: 6px;
                    }

                    .duration-label {
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

                    .info {
                        display: flex;
                        position: relative;
                        padding: 16px 0;

                        > .item {
                            flex-basis: 50%;
                            > .label {
                                font-size: 15px;
                                font-weight: 400;
                                color: var(--color);
                            }
                            > .value {
                                font-size: 18px;
                                padding-top: 2px;
                                font-weight: 700;
                            }
                        }

                        > .alert-positioner {
                            position: absolute;
                            top: 0;
                            bottom: 0;
                            width: 100%;
                            display: flex;
                            align-items: center;

                            > :global(.alert) {
                                width: 100%;
                            }
                        }
                    }

                    > .button-container {
                        position: relative;
                        display: table;

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

                @media screen and (min-width: 800px) {
                    form {
                        .info > .item {
                            flex-basis: 60%;

                            &:first-child {
                                flex-basis: 25%;
                            }
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
                            <td colSpan={2}>
                                <div className="max">{maxElement}</div>
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

                <div className="info">
                    <div className="item">
                        <div className="value">
                            {borrowInfo ? borrowInfo.apr : '0'}%
                        </div>
                        <div className="label">Interest rate</div>
                    </div>
                    <div className="item">
                        <div className="value">
                            {borrowInfo ? willOwe : '0'}
                        </div>
                        <div className="label">Owed after duration</div>
                    </div>

                    {alert ? (
                        <div className="alert-positioner">
                            <Alert style="error-filled" title={alert} />
                        </div>
                    ) : null}
                </div>

                <div className="button-container">
                    <Button
                        disabled={account ? disabledSubmit : false}
                        loading={waitingForTransaction}
                    >
                        {account ? 'Request Loan' : 'Connect Wallet'}
                    </Button>

                    {/* Disabled elements prevent any click events to be fired resulting in inputs not being blurred */}
                    {account && disabledSubmit ? (
                        <div className="clickable" />
                    ) : null}
                </div>
            </form>

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}
        </Box>
    )
}
