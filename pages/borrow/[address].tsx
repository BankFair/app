import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import {
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    APP_NAME,
    disabledBackground,
    format,
    getAddress,
    noop,
    oneHundredPercent,
    POOLS,
    useAccount,
    useProvider,
    withInterest,
    zero,
} from '../../app'
import {
    Alert,
    AmountInput,
    Box,
    Button,
    ConnectModal,
    LoanView,
    Modal,
    Page,
    PageLoading,
    useAmountForm,
} from '../../components'
import {
    contract,
    useLoadAccountLoans,
    LoanStatus,
    Pool,
    useLoans,
    usePoolLiquidity,
    useBorrowInfo,
    loanRequestedSignature,
    CoreContract,
    fetchLoan,
    formatStatus,
} from '../../features'
import { useSelector, useDispatch } from '../../store'

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

            <h1>{name}</h1>
            <RequestLoan pool={pool} poolAddress={address} />
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
    const account = useAccount()
    const provider = useProvider()

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
                console.log([account, isValid])
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
            canRequest: maxBigNumber.gte(borrowInfo.minAmount),
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
            parseUnits(value, tokenDecimals).lt(borrowInfo.minAmount),
        [borrowInfo, tokenDecimals, value],
    )

    const [duration, setDuration] = useState(initialDuration)
    const [durationMultiplier, setDurationMultiplier] = useState(
        initialDurationMultiplier,
    )

    const durationInSeconds = Number(duration) * Number(durationMultiplier)
    const isDurationTooLow =
        borrowInfo && durationInSeconds < borrowInfo.minDuration
    const isDurationTooHigh =
        borrowInfo && durationInSeconds > borrowInfo.maxDuration

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
                              BigNumber.from(borrowInfo!.minAmount),
                              tokenDecimals,
                          ),
                      )}`
                    : isDurationTooLow
                    ? `Minimum duration is ${
                          borrowInfo.minDuration / oneDay
                      } day`
                    : isDurationTooHigh
                    ? `Maximum duration is ${
                          borrowInfo.maxDuration / oneYear
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
              }
        : (event) => {
              event.preventDefault()
              setShowConnectModal(true)
          }

    return (
        <Box
            s
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

                        > :global(span) {
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

                    .info {
                        display: flex;
                        position: relative;
                        padding: 16px 0;
                        text-align: center;

                        > .item {
                            flex-basis: 50%;

                            > .label {
                                font-size: 11px;
                                text-transform: uppercase;
                                font-weight: 300;
                                color: var(--color-secondary);
                            }
                            > .value {
                                font-size: 18px;
                                padding-top: 2px;
                                font-weight: 400;
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

                <div className="info">
                    <div className="item">
                        <div className="label">Interest rate</div>
                        <div className="value">
                            {borrowInfo ? borrowInfo.apr : '0'}%
                        </div>
                    </div>
                    <div className="item">
                        <div className="label">Owed after duration</div>
                        <div className="value">
                            {borrowInfo ? willOwe : '0'}
                        </div>
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

const options = (
    <>
        <option value={-1}>all loans</option>
        <option value={LoanStatus.APPLIED}>
            loans {formatStatus(LoanStatus.APPLIED).toLowerCase()}
        </option>
        <option value={LoanStatus.APPROVED}>
            {formatStatus(LoanStatus.APPROVED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.DENIED}>
            {formatStatus(LoanStatus.DENIED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.CANCELLED}>
            {formatStatus(LoanStatus.CANCELLED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.DEFAULTED}>
            {formatStatus(LoanStatus.DEFAULTED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.FUNDS_WITHDRAWN}>
            {formatStatus(LoanStatus.FUNDS_WITHDRAWN).toLowerCase()} loans
        </option>
        <option value={LoanStatus.REPAID}>
            {formatStatus(LoanStatus.REPAID).toLowerCase()} loans
        </option>
    </>
)
function Loans({ pool, poolAddress }: { pool: Pool; poolAddress: string }) {
    const account = useAccount()
    const provider = useProvider()
    const [filter, setFilter] = useState<LoanStatus | -1>(-1)
    const loans = useLoans(poolAddress, account)
    const sortedAndFilteredLoans = useMemo(
        () =>
            (filter === -1
                ? loans
                : loans.filter((loan) => loan.status === filter)
            ).sort((a, b) => b.id - a.id),
        [filter, loans],
    )
    const dispatch = useDispatch()
    const [repay, setRepay] = useState<{ id: number; max: BigNumber } | null>(
        null,
    )

    useLoadAccountLoans(poolAddress, account, dispatch, pool)

    const handleBorrow = useCallback(
        (loanId: number) => {
            return contract
                .attach(poolAddress)
                .connect(provider!.getSigner())
                .borrow(BigNumber.from(loanId))
                .then(() => new Promise(noop)) // Event handler will unmount borrow button
        },
        [poolAddress, provider],
    )

    const handleRepay = useCallback(
        (id: number, max: BigNumber) => setRepay({ id, max }),
        [],
    )

    const header = (
        <div className="header">
            <style jsx>{`
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .filter {
                    font-size: 14px;
                }
            `}</style>
            <h2>Your loans</h2>
            <div className="filter">
                Show{' '}
                <select
                    value={filter}
                    className="xxs"
                    onChange={(event) => setFilter(Number(event.target.value))}
                >
                    {options}
                </select>
            </div>
        </div>
    )

    if (!sortedAndFilteredLoans.length) {
        const filterApplied = filter !== -1
        const emptyState = (
            <div>
                <style jsx>{`
                    div {
                        text-align: center;
                        border-radius: 16px;
                        padding: 30px 0;
                        background-color: ${disabledBackground};
                        color: var(--disabled-80);
                    }
                `}</style>
                {filterApplied
                    ? 'No loans match the filter'
                    : "You haven't requested any loans yet"}
                {filterApplied ? (
                    <Button
                        blue
                        ghost
                        onClick={() => setFilter(-1)}
                        style={{ display: 'block', margin: '10px auto 0' }}
                    >
                        Clear filter
                    </Button>
                ) : null}
            </div>
        )

        return (
            <>
                {header}
                {emptyState}
            </>
        )
    }

    const loansElement = (
        <div className="loans">
            <style jsx>{`
                .loans {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-start;

                    > :global(.loan) {
                        flex-basis: 100%;
                    }

                    @media screen and (min-width: 850px) {
                        > :global(.loan) {
                            flex-basis: calc(50% - 8px);

                            &:nth-child(2n - 1) {
                                margin-right: 8px;
                            }

                            &:nth-child(2n) {
                                margin-left: 8px;
                            }
                        }
                    }
                }
            `}</style>

            {sortedAndFilteredLoans.map((loan) => (
                <LoanView
                    key={loan.id}
                    loan={loan}
                    tokenDecimals={pool.tokenDecimals}
                    onBorrow={handleBorrow}
                    onRepay={handleRepay}
                />
            ))}

            {repay ? (
                <RepayModal
                    poolAddress={poolAddress}
                    loanId={repay.id}
                    tokenDecimals={pool.tokenDecimals}
                    tokenAddress={pool.tokenAddress}
                    max={repay.max}
                    onClose={() => setRepay(null)}
                />
            ) : null}
        </div>
    )

    return (
        <>
            {header}
            {loansElement}
        </>
    )
}

function RepayModal({
    poolAddress,
    loanId,
    tokenDecimals,
    tokenAddress,
    max,
    onClose,
}: {
    poolAddress: string
    loanId: number
    tokenDecimals: number
    tokenAddress: string
    max: BigNumber
    onClose(): void
}) {
    const dispatch = useDispatch()

    const { form } = useAmountForm({
        tokenAddress,
        tokenDecimals,
        poolAddress,
        onSumbit: (contract: CoreContract, amount: string) =>
            contract.repay(
                BigNumber.from(loanId),
                parseUnits(amount, tokenDecimals),
            ),
        refetch: () =>
            dispatch(fetchLoan({ poolAddress, loanId })).then(onClose),
        max,
        disabled: false,
        type: 'Repay',
    })

    return (
        <Modal onClose={onClose} autoWidth>
            <div>
                <style jsx>{`
                    div {
                        padding: 16px 24px;

                        > :global(form) {
                            margin: 0;
                        }
                    }
                    h3 {
                        text-align: center;
                        margin: 0 0 8px;
                    }
                `}</style>
                <h3>Repay</h3>
                {form}
            </div>
        </Modal>
    )
}
