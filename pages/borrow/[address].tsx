import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { DateTime } from 'luxon'
import { NextPage } from 'next'
import Head from 'next/head'
import {
    FormEventHandler,
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    amountWithInterest,
    APP_NAME,
    BORROWER_SERVICE_URL,
    format,
    getAddress,
    getERC20Contract,
    infiniteAllowance,
    oneDay,
    POOLS,
    prefix,
    rgbRed,
    shortenAddress,
    thirtyDays,
    TOKEN_SYMBOL,
    useAccount,
    useAmountWithInterest,
    useProvider,
    zero,
} from '../../app'
import {
    Alert,
    AmountInput,
    BackToPools,
    Box,
    Button,
    ConnectModal,
    Page,
    PageLoading,
} from '../../components'
import {
    Pool,
    useBorrowInfo,
    trackTransaction,
    loanDeskContract,
    LoanOffer,
    contract,
    LoanApplicationStatus,
    useLoans,
    fetchLoan,
    LoanStatus,
    loanBorrowedSignature,
    useLoadAccountLoans,
    useAllowanceAndBalance,
} from '../../features'
import { AppDispatch, useDispatch, useSelector } from '../../store'

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

            <BackToPools href="/borrow" />
            <h1>{name}</h1>
            <RepayLoans pool={pool} poolAddress={address} account={account} />
            <Offer pool={pool} poolAddress={address} account={account} />
            <RequestLoan pool={pool} poolAddress={address} account={account} />
        </Page>
    )
}

Borrow.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Borrow

function Offer({
    pool: { loanDeskAddress, liquidityTokenDecimals, block },
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string | undefined
}) {
    const provider = useProvider()
    const dispatch = useDispatch()

    const [offer, setOffer] = useState<{
        details: LoanOffer
        account: string
        contactDetails: {
            name: string
            businessName: string
            phone?: string
            email?: string
        }
        loanDeskAddress: string
    } | null>(null)
    const offerRef = useRef<string | undefined>()
    useEffect(() => {
        if (account === offerRef.current) return
        offerRef.current = account

        if (!account) return

        const contract = loanDeskContract
            .attach(loanDeskAddress)
            .connect(provider!)

        contract
            .queryFilter(contract.filters.LoanOffered(null, account), block)
            .then(async (events) => {
                if (!events.length) return

                events.sort(
                    (a, b) =>
                        b.args.applicationId.toNumber() -
                        a.args.applicationId.toNumber(),
                )

                const { applicationId } = events[0].args
                const request = await contract.loanApplications(applicationId)

                if (request.status !== LoanApplicationStatus.OFFER_MADE) return

                const [offer, contactDetails] = await Promise.all([
                    contract.loanOffers(applicationId),
                    fetch(
                        `${BORROWER_SERVICE_URL}/profile/${request.profileId}`,
                    ).then(
                        (response) =>
                            response.json() as Promise<{
                                name: string
                                businessName: string
                                phone?: string
                                email?: string
                            }>,
                    ),
                ])

                setOffer({
                    details: offer,
                    account,
                    loanDeskAddress,
                    contactDetails: contactDetails || {},
                })
            })
            .catch((error) => {
                console.error(error)
            })
    }, [account, block, loanDeskAddress, provider])

    const [isLoading, setIsLoading] = useState(false)
    const [isAccepted, setIsAccepted] = useState(false)

    if (
        !offer ||
        offer.account !== account ||
        offer.loanDeskAddress !== loanDeskAddress
    ) {
        return null
    }

    return (
        <Box
            className="loan-offer"
            overlay={isAccepted ? <h2>Funds withdrawn!</h2> : null}
        >
            <h3>Offer Received</h3>
            <div className="field">
                <div className="label">Amount</div>
                <div>
                    {format(
                        formatUnits(
                            offer.details.amount,
                            liquidityTokenDecimals,
                        ),
                    )}{' '}
                    {TOKEN_SYMBOL}
                </div>
            </div>
            <div className="field">
                <div className="label">Installment amount</div>
                <div>
                    {format(
                        formatUnits(
                            offer.details.installmentAmount,
                            liquidityTokenDecimals,
                        ),
                    )}{' '}
                    {TOKEN_SYMBOL}
                </div>
            </div>
            <div className="field">
                <div className="label">Installments</div>
                <div>{offer.details.installments}</div>
            </div>
            <div className="field">
                <div className="label">Duration</div>
                <div>
                    {offer.details.duration.toNumber() / thirtyDays} months
                </div>
            </div>
            <div className="field">
                <div className="label">Interest APR</div>
                <div>{offer.details.apr / 10}%</div>
            </div>
            <div className="field">
                <div className="label">Grace Default Period</div>
                <div>{offer.details.gracePeriod.toNumber() / oneDay} days</div>
            </div>

            <div className="field">
                <div className="label">Name</div>
                <div>{offer.contactDetails.name}</div>
            </div>
            <div className="field">
                <div className="label">Business Name</div>
                <div>{offer.contactDetails.businessName}</div>
            </div>
            {offer.contactDetails.phone ? (
                <div className="field">
                    <div className="label">Phone</div>
                    <div>
                        <a href={`tel:${offer.contactDetails.phone}`}>
                            {offer.contactDetails.phone}
                        </a>
                    </div>
                </div>
            ) : null}
            {offer.contactDetails.email ? (
                <div className="field">
                    <div className="label">Email</div>
                    <div>
                        <a href={`mailto:${offer.contactDetails.email}`}>
                            {offer.contactDetails.email}
                        </a>
                    </div>
                </div>
            ) : null}

            <Button
                disabled={isAccepted || isLoading}
                loading={isLoading}
                type="submit"
                onClick={async () => {
                    setIsLoading(true)

                    try {
                        const tx = await contract
                            .attach(poolAddress)
                            .connect(provider!.getSigner())
                            .borrow(offer.details.applicationId)

                        const {
                            payload: { receipt },
                        } = await trackTransaction(dispatch, {
                            tx,
                            name: 'Accept loan & withdraw',
                        })

                        for (const event of receipt.events || []) {
                            if (
                                event.eventSignature === loanBorrowedSignature
                            ) {
                                await dispatch(
                                    fetchLoan({
                                        poolAddress,
                                        loanId: BigNumber.from(
                                            event.args!.array[0],
                                        ),
                                    }),
                                )
                            }
                        }

                        setIsAccepted(true)
                    } catch (error) {
                        // TODO: Display to user if not cancelation
                        console.error(error)
                    }

                    setIsLoading(false)
                }}
            >
                Accept Loan &amp; Withdraw Funds
            </Button>

            <style jsx>{`
                :global(.loan-offer) {
                    > :global(button) {
                        margin-top: 16px;
                    }
                    > :global(h3) {
                        margin-top: 0;
                    }
                }

                .field {
                    margin-top: 16px;

                    > .label {
                        color: var(--color-secondary);
                        font-weight: 400;
                        margin-bottom: 8px;
                    }
                }
            `}</style>
        </Box>
    )
}

function RepayLoans({
    pool,
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string | undefined
}) {
    const provider = useProvider()
    const loans = useLoans(poolAddress, account)
    const dispatch = useDispatch()

    useLoadAccountLoans(poolAddress, account, dispatch, pool)

    return loans
        .sort((a, b) => a.id - b.id)
        .map((loan) => (
            <RepayLoan
                key={loan.id}
                pool={pool}
                poolAddress={poolAddress}
                loan={loan}
                provider={provider}
                dispatch={dispatch}
                account={account}
            />
        )) as unknown as JSX.Element
}

function RepayLoan({
    pool: { liquidityTokenAddress, liquidityTokenDecimals, loanDeskAddress },
    poolAddress,
    loan,
    provider,
    dispatch,
    account,
}: {
    pool: Pool
    poolAddress: string
    loan: ReturnType<typeof useLoans>[number]
    provider: ReturnType<typeof useProvider>
    dispatch: AppDispatch
    account: string | undefined
}) {
    const [amount, setAmount] = useState('')

    const outstandingNow = useAmountWithInterest(
        loan.amount,
        loan.details.baseAmountRepaid,
        loan.details.interestPaidUntil,
        loan.apr,
    )
    const repaid = useMemo(
        () => BigNumber.from(loan.details.totalAmountRepaid),
        [loan],
    )

    const { allowance, refetch: refetchAllowanceAndBalance } =
        useAllowanceAndBalance(liquidityTokenAddress, poolAddress, account)

    const needsApproval = useMemo(() => {
        if (!allowance) return false

        const approvalBigNumber = BigNumber.from(allowance)
        return (
            approvalBigNumber.eq(zero) ||
            approvalBigNumber.lt(
                amount ? parseUnits(amount, liquidityTokenDecimals) : zero,
            )
        )
    }, [allowance, amount, liquidityTokenDecimals])

    const [contactDetailsState, setContactDetailsState] = useState<{
        applicationId: number
        name: string
        businessName: string
        phone?: string
        email?: string
    } | null>(null)
    const contactDetails =
        contactDetailsState &&
        contactDetailsState.applicationId === loan.applicationId
            ? contactDetailsState
            : null
    useEffect(() => {
        loanDeskContract
            .connect(provider!)
            .attach(loanDeskAddress)
            .loanApplications(loan.applicationId)
            .then(({ profileId }) =>
                fetch(`${BORROWER_SERVICE_URL}/profile/${profileId}`),
            )
            .then(
                (response) =>
                    response.json() as Promise<{
                        name: string
                        businessName: string
                        phone?: string
                        email?: string
                    }>,
            )
            .then((info) =>
                setContactDetailsState({
                    ...info,
                    applicationId: loan.applicationId,
                }),
            )
    }, [loan, loanDeskAddress, provider])

    const [isLoading, setIsLoading] = useState(false)

    const handleRepay = useCallback<FormEventHandler<HTMLFormElement>>(
        (event) => {
            event.preventDefault()

            setIsLoading(true)

            const signer = provider!.getSigner()

            if (needsApproval) {
                getERC20Contract(liquidityTokenAddress)
                    .connect(signer)
                    .approve(poolAddress, infiniteAllowance)
                    .then((tx) =>
                        trackTransaction(dispatch, {
                            name: `Approve ${TOKEN_SYMBOL}`,
                            tx,
                        }),
                    )
                    .then(() => refetchAllowanceAndBalance())
                    .then(() => {
                        setIsLoading(false)
                    })
                    .catch((reason) => {
                        console.error(reason)
                        setIsLoading(false)
                    })

                return
            }

            contract
                .connect(signer)
                .attach(poolAddress)
                .repay(
                    BigNumber.from(loan.id),
                    parseUnits(amount, liquidityTokenDecimals),
                )
                .then((tx) =>
                    trackTransaction(dispatch, { tx, name: 'Repay loan' }),
                )
                .then(() =>
                    dispatch(fetchLoan({ poolAddress, loanId: loan.id })),
                )
                .then(() => {
                    setIsLoading(false)
                    setAmount('')
                })
                .catch((error) => {
                    console.error(error)
                })
        },
        [
            provider,
            needsApproval,
            poolAddress,
            loan,
            amount,
            liquidityTokenDecimals,
            liquidityTokenAddress,
            dispatch,
            refetchAllowanceAndBalance,
        ],
    )

    const wasRepaid = loan.status === LoanStatus.REPAID

    interface ScheduleItem {
        date: string
        dateTime: DateTime
        overdue: boolean
        amount: BigNumber
        skip: boolean
        expectedBaseAmountRepaid: BigNumber
        expectedTimestamp: number
    }
    const schedule = useMemo(() => {
        if (wasRepaid) return []
        const installmentAmount = BigNumber.from(loan.installmentAmount)
        const now = DateTime.now()
        const installmentDuration = loan.duration / loan.installments
        const amountBigNumber = BigNumber.from(loan.amount)

        let baseAmountRepaid = BigNumber.from(loan.details.baseAmountRepaid)
        let interestPaidUntil = loan.details.interestPaidUntil
        let paid = false

        return Array.from({
            length: loan.installments,
        }).reduce<ScheduleItem[]>((array, _, index) => {
            const installmentNumber = index + 1
            const timestamp =
                loan.borrowedTime + installmentDuration * installmentNumber
            const date = DateTime.fromSeconds(timestamp)

            if (paid) {
                array[index] = {
                    date: date.toLocaleString(),
                    dateTime: date,
                    overdue: false,
                    amount: zero,
                    skip: true,
                    expectedBaseAmountRepaid: zero,
                    expectedTimestamp: 0,
                }
                return array
            }

            const overdue = now > date
            const nextDate = DateTime.fromSeconds(
                timestamp + installmentDuration,
            )
            const previous = array[index - 1] as ScheduleItem | undefined
            let actualDate = date
            let skip = false
            let amount = installmentAmount

            const {
                principalOutstanding: expectedPrincipalOutstanding,
                interestOutstanding: expectedInterestOutstanding,
            } = amountWithInterest(
                amountBigNumber,
                previous ? previous.expectedBaseAmountRepaid : 0,
                previous ? previous.expectedTimestamp : loan.borrowedTime,
                loan.apr,
                timestamp,
            )

            let { principalOutstanding, interestOutstanding, daysPassed } =
                baseAmountRepaid.gte(amountBigNumber)
                    ? {
                          principalOutstanding: zero,
                          interestOutstanding: zero,
                          daysPassed: 0,
                      }
                    : amountWithInterest(
                          amountBigNumber,
                          baseAmountRepaid,
                          interestPaidUntil,
                          loan.apr,
                          timestamp,
                      )

            const outstanding = principalOutstanding.add(interestOutstanding)

            if (installmentAmount.gt(outstanding)) {
                amount = outstanding
            }

            const expectedBaseAmountRepaid = installmentAmount
                .sub(expectedInterestOutstanding)
                .add(previous ? previous.expectedBaseAmountRepaid : zero)

            if (overdue) {
                if (nextDate) {
                    if (nextDate > now) {
                        if (
                            principalOutstanding.lte(
                                expectedPrincipalOutstanding,
                            )
                        ) {
                            skip = true
                        } else {
                            const {
                                principalOutstanding:
                                    nextExpectedPrincipalOutstanding,
                            } = amountWithInterest(
                                amountBigNumber,
                                expectedBaseAmountRepaid,
                                timestamp,
                                loan.apr,
                                timestamp + installmentDuration,
                            )

                            actualDate = now

                            const {
                                interestOutstanding: currentInterestOutstanding,
                                daysPassed: currentDaysPassed,
                            } = amountWithInterest(
                                amountBigNumber,
                                loan.details.baseAmountRepaid,
                                loan.details.interestPaidUntil,
                                loan.apr,
                                Math.trunc(now.toSeconds()),
                            )
                            amount = principalOutstanding
                                .sub(nextExpectedPrincipalOutstanding)
                                .add(currentInterestOutstanding)

                            daysPassed = currentDaysPassed
                            interestOutstanding = currentInterestOutstanding
                        }
                    } else {
                        skip = true
                    }
                }
            } else {
                const previous = array[index - 1]
                if (
                    ((previous && previous.amount.eq(zero)) ||
                        installmentNumber === 1) &&
                    principalOutstanding.lt(expectedPrincipalOutstanding) &&
                    interestOutstanding.lt(expectedInterestOutstanding)
                ) {
                    const {
                        principalOutstanding: nextExpectedPrincipalOutstanding,
                    } = amountWithInterest(
                        amountBigNumber,
                        expectedBaseAmountRepaid,
                        timestamp,
                        loan.apr,
                        timestamp + installmentDuration,
                    )

                    const {
                        interestOutstanding: currentInterestOutstanding,
                        daysPassed: currentDaysPassed,
                    } = amountWithInterest(
                        amountBigNumber,
                        loan.details.baseAmountRepaid,
                        loan.details.interestPaidUntil,
                        loan.apr,
                        timestamp,
                    )

                    amount = principalOutstanding
                        .sub(nextExpectedPrincipalOutstanding)
                        .add(currentInterestOutstanding)

                    if (amount.lt(zero)) {
                        skip = true
                    } else {
                        daysPassed = currentDaysPassed
                        interestOutstanding = currentInterestOutstanding
                    }
                } else if (
                    previous &&
                    previous.amount.gt(installmentAmount) &&
                    now.equals(previous.dateTime)
                ) {
                    const {
                        interestOutstanding: currentInterestOutstanding,
                        daysPassed: currentDaysPassed,
                    } = amountWithInterest(
                        amountBigNumber,
                        baseAmountRepaid,
                        interestPaidUntil,
                        loan.apr,
                        timestamp,
                    )
                    interestOutstanding = currentInterestOutstanding
                    daysPassed = currentDaysPassed
                    amount = expectedBaseAmountRepaid
                        .sub(baseAmountRepaid)
                        .add(currentInterestOutstanding)
                }
            }

            if (skip) {
                amount = zero
            } else if (amount.lt(interestOutstanding)) {
                const payableInterestDays = amount
                    .mul(daysPassed)
                    .div(interestOutstanding)

                amount = interestOutstanding
                    .mul(payableInterestDays)
                    .div(daysPassed)
                interestPaidUntil += payableInterestDays.toNumber() * oneDay
            } else {
                baseAmountRepaid = baseAmountRepaid.add(
                    amount.sub(interestOutstanding),
                )
                interestPaidUntil += daysPassed * oneDay
            }

            if (
                installmentNumber === loan.installments &&
                outstanding.gt(amount)
            ) {
                amount = outstanding
            }

            if (baseAmountRepaid.gte(amountBigNumber)) {
                paid = true
            }

            array[index] = {
                date: actualDate.toLocaleString(),
                dateTime: actualDate,
                overdue: overdue
                    ? !now.startOf('day').equals(date.startOf('day'))
                    : false,
                amount,
                skip: amount.eq(zero),
                expectedBaseAmountRepaid,
                expectedTimestamp: timestamp,
            }
            return array
        }, [])
    }, [loan, wasRepaid])

    return (
        <>
            <Box>
                <h2>Loan Status</h2>
                <div className="stats">
                    <div className="stat">
                        <div className="label">Outstanding</div>
                        <div className="value">
                            {format(
                                formatUnits(
                                    outstandingNow,
                                    liquidityTokenDecimals,
                                ),
                            )}{' '}
                            {TOKEN_SYMBOL}
                        </div>
                    </div>
                </div>
            </Box>
            <form className="main" onSubmit={handleRepay}>
                <Box
                    className="repay"
                    overlay={
                        loan.status === LoanStatus.REPAID
                            ? 'Loan fully repaid'
                            : undefined
                    }
                >
                    <h2>Repay Loan</h2>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={amount}
                        onChange={setAmount}
                    />
                    <Button
                        type="submit"
                        loading={isLoading}
                        disabled={
                            (Number(amount) === 0 && !needsApproval) ||
                            isLoading
                        }
                    >
                        {needsApproval ? `Approve ${TOKEN_SYMBOL}` : 'Repay'}
                    </Button>
                    <Alert
                        style="warning"
                        title="Late payments will affect your on chain credit rating"
                    />
                </Box>
                <Box className="details">
                    <h3>Loan Contract Details</h3>

                    <div className="field">
                        <span className="label">Initial loan amount:</span>{' '}
                        {format(
                            formatUnits(loan.amount, liquidityTokenDecimals),
                        )}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                    <div className="field">
                        <span className="label">Repaid:</span>{' '}
                        {format(formatUnits(repaid, liquidityTokenDecimals))}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                    <div className="field">
                        <span className="label">Total interest paid:</span>{' '}
                        {format(
                            formatUnits(
                                loan.details.interestPaid,
                                liquidityTokenDecimals,
                            ),
                        )}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                    {
                        // TODO: Display time remaining and start date instead of duration
                    }
                    <div className="field">
                        <span className="label">Duration:</span>{' '}
                        {loan.duration / thirtyDays} months
                    </div>
                    <div className="field">
                        <span className="label">Interest APR:</span> {loan.apr}%
                    </div>
                    <div className="field">
                        <span className="label">Grace default period:</span>{' '}
                        {loan.gracePeriod / oneDay} days
                    </div>

                    <div className="field">
                        <span className="label">Name:</span>{' '}
                        {contactDetails?.name}
                    </div>
                    <div className="field">
                        <span className="label">Business name:</span>{' '}
                        {contactDetails?.businessName}
                    </div>
                    {contactDetails?.phone ? (
                        <div className="field">
                            <span className="label">Phone:</span>{' '}
                            <a href={`tel:${contactDetails.phone}`}>
                                {contactDetails.phone}
                            </a>
                        </div>
                    ) : null}
                    {contactDetails?.email ? (
                        <div className="field">
                            <span className="label">Email:</span>{' '}
                            <a href={`mailto:${contactDetails.email}`}>
                                {contactDetails.email}
                            </a>
                        </div>
                    ) : null}
                </Box>
            </form>

            {wasRepaid ? null : (
                <Box>
                    <h3>Future Re-Payments Due</h3>

                    <div className="schedule">
                        <div className="label">Amount</div>
                        <div className="label">Due</div>

                        {schedule.map((item, index) =>
                            item.skip ? null : (
                                <Fragment key={index}>
                                    <div className={item.overdue ? 'red' : ''}>
                                        {formatUnits(
                                            item.amount,
                                            liquidityTokenDecimals,
                                        )}{' '}
                                        {TOKEN_SYMBOL}
                                    </div>
                                    <div className={item.overdue ? 'red' : ''}>
                                        {item.date}
                                        {item.overdue ? ' (overdue)' : ''}
                                    </div>
                                </Fragment>
                            ),
                        )}
                    </div>
                </Box>
            )}

            <style jsx>{`
                h2,
                h3 {
                    margin-top: 0;
                    margin-bottom: 16px;
                }

                .stats {
                    > .stat {
                        > .label {
                            color: var(--color-secondary);
                            font-weight: 400;
                            margin-bottom: 8px;
                        }

                        > .value {
                            font-weight: 700;
                            font-size: 24px;
                        }
                    }
                }

                .main {
                    > :global(.repay) {
                        :global(button) {
                            margin-top: 8px;
                            margin-bottom: 16px;
                            display: flex;
                        }
                    }
                }

                :global(.details) {
                    > .field {
                        margin-top: 8px;

                        > .label {
                            color: var(--color-secondary);
                            font-weight: 400;
                            margin-bottom: 8px;
                        }
                    }
                }

                .schedule {
                    display: grid;
                    grid-template-columns: minmax(auto, max-content) auto;
                    row-gap: 8px;
                    column-gap: 16px;

                    > .label {
                        color: var(--color-secondary);
                    }

                    > .red {
                        color: ${rgbRed};
                    }
                }

                @media screen and (min-width: 1000px) {
                    .main {
                        display: flex;

                        > :global(.box) {
                            flex-basis: 50%;
                            margin: 0;

                            &:first-child {
                                margin-right: 8px;
                            }

                            &:last-child {
                                margin-left: 8px;
                            }
                        }
                    }
                }
            `}</style>
        </>
    )
}

const oneWeek = oneDay * 7
const oneYear = oneWeek * 52 + oneDay
const initialValue = ''
const initialDuration = ''
const initialDisplayAlert = false
function RequestLoan({
    pool: { managerAddress, loanDeskAddress, liquidityTokenDecimals },
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string | undefined
}) {
    const provider = useProvider()

    const dispatch = useDispatch()

    const [displayAlert, setDisplayAlert] = useState(initialDisplayAlert)
    const showDisplayAlert = useCallback(() => setDisplayAlert(true), [])

    const [showConnectModal, setShowConnectModal] = useState(false)
    useEffect(() => {
        if (account) setShowConnectModal(false)
    }, [account])

    const [loading, setLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const [loanPendingApproval, setLoanPendingApproval] = useState<{
        hasOpenApplication: boolean
        account: string
        loanDeskAddress: string
    } | null>(null)
    const loanPendingApprovalRef = useRef<string | undefined>()
    useEffect(() => {
        if (account === loanPendingApprovalRef.current) return
        loanPendingApprovalRef.current = account

        if (!account) return

        loanDeskContract
            .attach(loanDeskAddress)
            .connect(provider!)
            .borrowerStats(account)
            .then(({ hasOpenApplication }) => {
                setLoanPendingApproval({
                    hasOpenApplication,
                    account,
                    loanDeskAddress,
                })
            })
            .catch((error) => {
                console.error(error)
            })
    }, [account, loanDeskAddress, provider])

    const isLoanPendingApproval =
        loanPendingApproval &&
        loanPendingApproval.hasOpenApplication &&
        loanPendingApproval.account === account &&
        loanDeskAddress === loanPendingApproval.loanDeskAddress

    const borrowInfo = useBorrowInfo(poolAddress, loanDeskAddress)

    const [name, setName] = useState('')
    const [businessName, setBusinessName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')

    const emailInputRef = useRef<HTMLInputElement>(null)

    const [amount, setAmount] = useState(initialValue)

    const [duration, setDuration] = useState(initialDuration)
    const durationMultiplier = thirtyDays

    const { invalidAmountMessage, invalidDurationMessage } = useMemo(() => {
        if (!borrowInfo) {
            return {
                invalidAmountMessage: '',
                invalidDurationMessage: '',
            }
        }

        const durationInSeconds = Number(duration) * Number(durationMultiplier)
        const isDurationTooLow = durationInSeconds < borrowInfo.minLoanDuration
        const isDurationTooHigh = durationInSeconds > borrowInfo.maxLoanDuration

        const isAmountValid = checkAmountValidity(
            amount,
            liquidityTokenDecimals,
            borrowInfo.minLoanAmount,
        )

        return {
            invalidAmountMessage: isAmountValid
                ? ''
                : `Minimum amount is ${format(
                      formatUnits(
                          BigNumber.from(borrowInfo.minLoanAmount),
                          liquidityTokenDecimals,
                      ),
                  )}`,
            invalidDurationMessage: isDurationTooLow
                ? `Minimum duration is ${
                      borrowInfo.minLoanDuration / oneDay
                  } day`
                : isDurationTooHigh
                ? `Maximum duration is ${
                      borrowInfo.maxLoanDuration / oneYear
                  } years`
                : '',
        }
    }, [
        borrowInfo,
        duration,
        durationMultiplier,
        liquidityTokenDecimals,
        amount,
    ])

    const alert = useMemo(
        () =>
            !checkValidityNotEmpty(name)
                ? 'Please enter your name'
                : !checkValidityNotEmpty(businessName)
                ? 'Please enter your business name'
                : !checkValidityNotEmpty(email) && !checkValidityNotEmpty(phone)
                ? 'Please enter an email or phone number'
                : !emailInputRef.current?.checkValidity()
                ? 'Invalid email'
                : isLoanPendingApproval
                ? 'x'
                : invalidAmountMessage || invalidDurationMessage || null,
        [
            businessName,
            email,
            invalidAmountMessage,
            invalidDurationMessage,
            isLoanPendingApproval,
            name,
            phone,
        ],
    )

    const isManager = managerAddress === account
    const componentIsLoading =
        !borrowInfo || Boolean(account && !loanPendingApproval)
    const disabled = isManager || componentIsLoading
    const disabledSubmit = Boolean(
        loading || disabled || !amount || alert || isSubmitted,
    )

    const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (event) => {
            event.preventDefault()
            if (!account) {
                setShowConnectModal(true)
                return
            }

            if (disabledSubmit) return

            setLoading(true)

            const parsedAmount = parseUnits(amount, liquidityTokenDecimals)
            const parsedDuration = BigNumber.from(
                Number(duration) * Number(durationMultiplier),
            )

            const signer = provider!.getSigner()

            // TODO: Handle errors
            // TODO: Handle user cancelation
            signer
                .signMessage(
                    `My name is ${name.trim()}.\nMy business name is ${businessName.trim()}.${
                        phone ? `\nMy phone is ${phone.trim()}.` : ''
                    }${email ? `\nMy email is ${email.trim()}.` : ''}`,
                )
                .then((walletSignature) =>
                    fetch(`${BORROWER_SERVICE_URL}/profile`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            name,
                            businessName,
                            phone,
                            email,
                            walletSignature,
                            walletAddress: account.toLowerCase(),
                        }),
                    }),
                )
                .then((response) => response.json())
                .then(({ id, digest }: { id: string; digest: string }) =>
                    loanDeskContract
                        .attach(loanDeskAddress)
                        .connect(signer)
                        .requestLoan(parsedAmount, parsedDuration, id, digest),
                )
                .then((tx) =>
                    trackTransaction(dispatch, {
                        name: `Request loan for ${amount} ${TOKEN_SYMBOL}`,
                        tx,
                    }),
                )
                .then(() => {
                    setIsSubmitted(true)
                    setLoading(false)
                })
                .catch((error) => {
                    console.error(error)
                    setLoading(false)
                })
        },
        [
            account,
            businessName,
            disabledSubmit,
            dispatch,
            duration,
            durationMultiplier,
            email,
            liquidityTokenDecimals,
            loanDeskAddress,
            name,
            phone,
            provider,
            amount,
        ],
    )

    return (
        <Box
            loading={componentIsLoading}
            overlay={
                isManager ? (
                    `Manager can't request a loan`
                ) : isLoanPendingApproval ? (
                    'A loan application you requested is pending approval'
                ) : isSubmitted ? (
                    <div>
                        <h2>Thank you for applying!</h2>
                        <h2>The pool manager will be in touch shortly.</h2>
                    </div>
                ) : undefined
            }
        >
            <style jsx>{`
                form {
                    > h3 {
                        margin: 0;
                    }

                    > label {
                        display: block;
                        margin-top: 16px;

                        > .label {
                            color: var(--color-secondary);
                            font-weight: 400;
                            margin-bottom: 8px;
                        }
                    }

                    > .alert-positioner {
                        margin-top: 16px;

                        > :global(.alert) {
                            width: 100%;
                        }
                    }

                    > .button-container {
                        margin-top: 16px;
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
                <h3>Apply For a Loan</h3>

                <label>
                    <div className="label">Account</div>
                    <input
                        type="text"
                        required={Boolean(account)}
                        disabled
                        value={account ? shortenAddress(account) : ''}
                    />
                </label>
                <label>
                    <div className="label">Name</div>
                    <input
                        type="text"
                        required={Boolean(account)}
                        placeholder="John Smith"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onBlur={() =>
                            !checkValidityNotEmpty(name) &&
                            setDisplayAlert(true)
                        }
                    />
                </label>
                <label>
                    <div className="label">Business Name</div>
                    <input
                        type="text"
                        required={Boolean(account)}
                        placeholder="Green LLC"
                        value={businessName}
                        onChange={(event) =>
                            setBusinessName(event.target.value)
                        }
                        onBlur={() =>
                            !checkValidityNotEmpty(businessName) &&
                            setDisplayAlert(true)
                        }
                    />
                </label>
                <label>
                    <div className="label">Phone</div>
                    <input
                        type="tel"
                        placeholder="+1 (555) 343-3411"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        onBlur={() =>
                            !checkValidityNotEmpty(email) &&
                            !checkValidityNotEmpty(phone) &&
                            setDisplayAlert(true)
                        }
                    />
                </label>
                <label>
                    <div className="label">Email</div>
                    <input
                        ref={emailInputRef}
                        type="email"
                        placeholder="johnsmith@gmail.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() =>
                            ((!checkValidityNotEmpty(email) &&
                                !checkValidityNotEmpty(phone)) ||
                                !emailInputRef.current?.checkValidity()) &&
                            setDisplayAlert(true)
                        }
                    />
                </label>
                <label>
                    <div className="label">Amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={amount}
                        onChange={setAmount}
                        disabled={disabled}
                        onBlur={() =>
                            !checkAmountValidity(
                                amount,
                                liquidityTokenDecimals,
                                borrowInfo!.minLoanAmount,
                            ) && setDisplayAlert(true)
                        }
                        onKeyDown={(event) =>
                            event.key === 'Enter'
                                ? !checkAmountValidity(
                                      amount,
                                      liquidityTokenDecimals,
                                      borrowInfo!.minLoanAmount,
                                  ) && setDisplayAlert(true)
                                : undefined
                        }
                    />
                </label>
                <label>
                    <div className="label">Duration</div>
                    <AmountInput
                        decimals={4}
                        value={duration}
                        onChange={setDuration}
                        onBlur={showDisplayAlert}
                        disabled={disabled}
                        noToken
                        label="months"
                        paddingRight={60}
                        onKeyDown={(event) =>
                            event.key === 'Enter'
                                ? setDisplayAlert(true)
                                : undefined
                        }
                    />
                </label>

                {displayAlert && alert ? (
                    <div className="alert-positioner">
                        <Alert style="error-filled" title={alert} />
                    </div>
                ) : null}

                <div className="button-container">
                    <Button
                        type="submit"
                        disabled={account ? disabledSubmit : false}
                        loading={loading}
                    >
                        {account ? 'Request Loan' : 'Connect Wallet'}
                    </Button>

                    {/* Disabled elements prevent any click events to be fired resulting in inputs not being blurred */}
                    {account && disabledSubmit ? (
                        <div className="clickable" onClick={showDisplayAlert} />
                    ) : null}
                </div>
            </form>

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}
        </Box>
    )
}

function checkValidityNotEmpty(value: string) {
    return Boolean(value.trim())
}

function checkAmountValidity(
    value: string,
    liquidityTokenDecimals: number,
    minLoanAmount: string,
) {
    return value
        ? parseUnits(value, liquidityTokenDecimals).gte(minLoanAmount)
        : false
}
