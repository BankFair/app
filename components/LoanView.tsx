import '@formatjs/intl-locale/polyfill'
import '@formatjs/intl-numberformat/polyfill'
import '@formatjs/intl-numberformat/locale-data/en'
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-listformat/polyfill'
import '@formatjs/intl-listformat/locale-data/en'

import {BigNumber} from 'ethers'
import {Duration} from 'luxon'
import {FormEventHandler, Fragment, useCallback, useEffect, useMemo, useState} from 'react'
import TimeAgo from 'timeago-react'

import {
    Address,
    BORROWER_SERVICE_URL,
    fetchBorrowerInfoAuthenticated, formatPercent,
    formatToken,
    getBorrowerInfo, getERC20Contract, InputAmount,
    LocalDetail,
    noop, oneDay,
    oneHundredMillion,
    rgbaLimeGreen21,
    rgbGreen,
    rgbRed,
    rgbRedLight,
    rgbYellow,
    setBorrowerInfo,
    thirtyDays,
    TOKEN_SYMBOL,
    useAccount,
    useAmountWithInterest,
    useProvider,
    zero,
} from '../app'

import {
    contract, fetchLoan,
    formatStatus,
    Loan,
    loanDeskContract,
    LoanStatus, Pool,
    trackTransaction, useAllowanceAndBalance, useLoans,
    useSimpleSchedule
} from '../features'

import {EtherscanAddress} from './EtherscanLink'
import {Button} from './Button'
import {Progress} from './Progress'
import {Modal} from "./Modal";
import {AppDispatch, useDispatch, useSelector} from "../store";
import {Alert} from "./Alert";
import {parseUnits} from "@ethersproject/units";
import {Box} from "./Box";
import {AmountInput} from "./AmountInput";

export function LoanView({
    loan,
    liquidityTokenDecimals,
    poolAddress,
    loanDeskAddress,
}: {
    loan: Loan
    liquidityTokenDecimals: number
    poolAddress: Address
    loanDeskAddress: Address
}) {
    const provider = useProvider()
    const dispatch = useDispatch()
    const account = useAccount()

    const applicationId = loan.applicationId;
    const borrower = loan.borrower;
    const amount = loan.amount;
    const apr = loan.apr;
    const borrowedTime = loan.borrowedTime;
    const duration = loan.duration;
    const status = loan.status;
    const details = loan.details;

    const formattedAmount = useMemo(
        () => formatToken(amount, liquidityTokenDecimals),
        [amount, liquidityTokenDecimals],
    )
    const formattedStatus = useMemo(() => formatStatus(status), [status])

    const amountWithInterest = useAmountWithInterest(
        amount,
        details.baseAmountRepaid,
        details.interestPaidUntil,
        apr,
    )
    const { debt, repaid, percent } = useMemo(() => {
        const repaid = BigNumber.from(details.totalAmountRepaid)
        const repaidPrincipal = BigNumber.from(details.baseAmountRepaid)

        return {
            debt: amountWithInterest,
            repaid,
            percent: !zero.eq(amountWithInterest)
                ? Math.min(
                    repaidPrincipal
                      .mul(oneHundredMillion)
                      .div(amount)
                      .toNumber() / 1_000_000,
                      100
                    )
                : 0,
        }
    }, [details, amountWithInterest])

    const [borrowerInfoState, setBorrowerInfoState] = useState<{
        name: string
        businessName: string
        phone?: string | undefined
        email?: string | undefined
        isLocalCurrencyLoan?: boolean
        localDetail: LocalDetail
    } | null>(null)
    const [profileId, setProfileId] = useState('')
    useEffect(() => {
        let canceled = false
        getBorrowerInfo(applicationId)
            .then(async (info) => {
                if (canceled) return
                /*
                if (info) {
                    setBorrowerInfoState(info)

                    if (!info.email && !info.phone) {
                        const application = await loanDeskContract
                            .attach(loanDeskAddress)
                            .loanApplications(applicationId)

                        if (canceled) return

                        setProfileId(application.profileId)
                    }

                    return
                }
                */

                const application = await loanDeskContract
                    .attach(loanDeskAddress)
                    .loanApplications(applicationId)

                const response = await fetch(
                    `${BORROWER_SERVICE_URL}/profile/${application.profileId}`,
                )
                const fetchedInfo = await (response.json() as Promise<{
                    name: string
                    businessName: string
                    phone?: string
                    email?: string
                    isLocalCurrencyLoan?: boolean
                    localDetail: LocalDetail
                }>)

                if (canceled) return
                setProfileId(application.profileId)
                setBorrowerInfo(applicationId, fetchedInfo)
                setBorrowerInfoState(fetchedInfo)
            })
            .catch((error) => {
                console.error(error)
            })

        return () => {
            canceled = true
        }
    }, [applicationId, loanDeskAddress])

    const [managerEarnings, setEarnings] = useState<BigNumber | null>(null)

    const [managerStake, setManagerStake] = useState<BigNumber | null>(null)

    useEffect(() => {
        if (!account) return
        contract
            .attach(poolAddress)
            .revenueBalanceOf(account)
            .then((earnings) => {
                if (!earnings.gt(BigNumber.from(0))) return
                setEarnings(earnings)
            })
            .catch((error) => {
                console.error(error)
            })

        contract
            .attach(poolAddress)
            .balanceStaked()
            .then((stake) => {
                if (!stake.gt(BigNumber.from(0))) return
                setManagerStake(stake)
            })
            .catch((error) => {
                console.error(error)
            })
    }, [account, poolAddress])

    const hasDebt = status === LoanStatus.OUTSTANDING
    const isRepaid = status === LoanStatus.REPAID

    const schedule = useSimpleSchedule(
        isRepaid ? null : loan,
        BigNumber.from((Number(borrowerInfoState?.localDetail?.localInstallmentAmount ?? 0) * 1000000).toFixed(0)),
        borrowerInfoState?.localDetail?.fxRate ?? 1)

    const [closeLoading, setCloseLoading] = useState(false)
    const [showCloseModal, setShowCloseModal] = useState(false)

    const pool = useSelector((s) => s.pools[poolAddress])
    const [showRepayModal, setShowRepayModal] = useState(false)


    return (
        <div className="loan">
            <style jsx>{`
                .loan {
                    background-color: var(--bg-section);
                    // backdrop-filter: blur(16px);
                    border: 1px solid ${rgbaLimeGreen21};
                    border-radius: 8px;
                    padding: 18px 24px;
                    margin: 8px 0;
                }

                .amount {
                    margin: 0 0 8px;
                    font-weight: 600;
                }

                .progress-legend {
                    margin: 4px 2px 0;
                    display: flex;
                    justify-content: space-between;

                    > .item {
                        font-size: 12px;
                        display: flex;
                        align-items: center;

                        > .dot {
                            display: inline-block;
                            width: 6px;
                            height: 6px;
                            margin-right: 4px;
                            border-radius: 50%;
                        }
                    }
                }

                .stats {
                    display: flex;
                    flex-wrap: wrap;
                    text-align: center;
                    margin-top: 8px;

                    > .item {
                        flex-basis: 50%;
                        margin-top: 8px;

                        > .label {
                            font-size: 11px;
                            text-transform: uppercase;
                            font-weight: 300;
                            color: var(--color-secondary);
                        }

                        > .value {
                            font-size: 14px;
                            padding-top: 2px;
                            font-weight: 400;
                        }
                    }
                }

                .actions {
                    text-align: center;
                    margin-top: 8px;

                    > :global(button) {
                        margin: 0 4px;
                    }
                    
                    > a {
                        width: 33%;
                        color: var(--greenery);
                        font-weight: 600;
                        font-size: 16px;
                        
                        display: inline-block;
                        cursor: pointer;
                        line-height: 24px;
                    }
                    
                    > :global(svg) {
                        margin-right: 8px;
                    }
                    
                    .disabled {
                      color: var(--color-secondary);
                      cursor: default;
                      opacity: 0.5;
                      text-decoration: none;
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
            `}</style>

            <h4 className="amount">
                {borrowerInfoState ? borrowerInfoState.name : <></>}
                {hasDebt
                    ? ` ${formatToken(debt, liquidityTokenDecimals, 2, true)}`
                    : ` ${
                          isRepaid
                              ? formatToken(repaid, liquidityTokenDecimals, 2)
                              : formattedAmount
                      }`}{' '}
                {TOKEN_SYMBOL}
            </h4>
            <Progress
                l
                percent={percent}
                backgroundColor={
                    hasDebt
                        ? rgbRedLight
                        : isRepaid
                        ? rgbGreen
                        : status === LoanStatus.DEFAULTED
                        ? rgbRed
                        : rgbYellow
                }
            />

            <div className="progress-legend">
                {hasDebt ? (
                    <>
                        <div className="item">
                            <span
                                className="dot"
                                style={{ backgroundColor: rgbGreen }}
                            />
                            Repaid ({Math.trunc(percent)}%)
                        </div>
                        <div className="item">
                            <span
                                className="dot"
                                style={{ backgroundColor: rgbRedLight }}
                            />
                            Remaining
                        </div>
                    </>
                ) : (
                    <div className="item">{formattedStatus}</div>
                )}
            </div>
            <div className="stats">
                <div className="item">
                    <div className="label">Approved</div>
                    <div className="value">
                        <TimeAgo datetime={borrowedTime * 1000} />
                    </div>
                </div>
                <div className="item">
                    <div className="label">Duration</div>
                    <div className="value">{formatDuration(duration)}</div>
                </div>
                <div className="item">
                    <div className="label">Remaining</div>
                    <div className="value">
                        <Remaining timestamp={borrowedTime + duration} noHoursAndLess={true} />
                    </div>
                </div>
                <div className="item">
                    <div className="label">Status</div>
                    <div className="value">{formatStatus(status)}</div>
                </div>
                <div className="item">
                    <div className="label">Principal</div>
                    <div className="value">
                        {formatToken(amount, liquidityTokenDecimals, 2, true)}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                </div>
                <div className="item">
                    <div className="label">Interest paid</div>
                    <div className="value">
                        {formatToken(
                            details.interestPaid,
                            liquidityTokenDecimals,
                            2,
                            false
                        )}{' '}
                        {TOKEN_SYMBOL}
                    </div>
                </div>
                {!borrowerInfoState?.isLocalCurrencyLoan ? null :
                    <div className="item">
                        <div className="label">UGX Due</div>
                        <div className="value">
                            {hasDebt
                                ? ` ${formatToken(
                                        debt.mul((Number(borrowerInfoState.localDetail.fxRate) * 100).toFixed(0)).div(100),
                                        liquidityTokenDecimals, 
                                        2, 
                                        true)}`
                                : ` ${
                                    isRepaid
                                        ? formatToken(BigNumber.from(0), liquidityTokenDecimals, 2)
                                        : formattedAmount
                                }`}{' '}
                            {borrowerInfoState.localDetail.localCurrencyCode}
                        </div>
                    </div>
                }
                <div className="item">
                    <div className="label">Account</div>
                    <div className="value">
                        <EtherscanAddress address={borrower} />
                    </div>
                </div>
                {borrowerInfoState ? (
                    <>
                        <div className="item">
                            <div className="label">Business name</div>
                            <div className="value">
                                {borrowerInfoState.businessName}
                            </div>
                        </div>
                        {borrowerInfoState.phone ? (
                            <div className="item">
                                <div className="label">Phone</div>
                                <div className="value">
                                    <a href={`tel:${borrowerInfoState.phone}`}>
                                        {borrowerInfoState.phone}
                                    </a>
                                </div>
                            </div>
                        ) : null}
                        {borrowerInfoState.email ? (
                            <div className="item">
                                <div className="label">Email</div>
                                <div className="value">
                                    <a
                                        href={`mailto:${borrowerInfoState.email}`}
                                    >
                                        {borrowerInfoState.email}
                                    </a>
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : null}

            </div>


                <div className="actions">
                    {borrowerInfoState &&
                    !borrowerInfoState.phone &&
                    !borrowerInfoState.email &&
                    profileId ? (
                        <a
                            onClick={() =>
                                fetchBorrowerInfoAuthenticated(
                                    poolAddress,
                                    applicationId,
                                    profileId,
                                    account!,
                                    provider!.getSigner(),
                                ).then(setBorrowerInfoState)
                            }
                            style={{width: '100%', marginBottom: '12px'}}
                            >
                            Contacts
                        </a>
                    ) : null}
                    <a className={loan.status == LoanStatus.OUTSTANDING ? "" : "disabled"}

                       onClick={(event) => {
                           loan.status == LoanStatus.OUTSTANDING
                               ? setShowRepayModal(true)
                               : event.preventDefault()
                       }}
                        >
                        Repay
                    </a>
                    <a className={loan.status == LoanStatus.OUTSTANDING ? "" : "disabled"}

                       onClick={(event) => {
                           loan.status == LoanStatus.OUTSTANDING
                               ? setShowCloseModal(true)
                               : event.preventDefault()
                       }}
                        >
                        Close
                    </a>
                    <a className="disabled">Default</a>
                </div>

            {isRepaid ? null : (
                <>
                    <h3>Re-Payment Schedule</h3>

                    <div className="schedule">
                        <div className="label">Due</div>
                        <div className="label">Amount</div>

                        {schedule.map((item, index) =>
                            item.skip ? null : (
                                <Fragment key={index}>
                                    <div>
                                        {item.date}
                                    </div>
                                    <div>
                                        {!borrowerInfoState?.isLocalCurrencyLoan ? null :
                                            <>
                                                {formatToken(
                                                    item.localAmount,
                                                    liquidityTokenDecimals,
                                                    2,
                                                    true,
                                                )}{' '}
                                                {borrowerInfoState.localDetail.localCurrencyCode}
                                                {' '}
                                                (
                                            </>
                                        }
                                        {formatToken(
                                            item.amount,
                                            liquidityTokenDecimals,
                                            2,
                                            true,
                                        )}{' '}
                                        {TOKEN_SYMBOL}
                                        {!borrowerInfoState?.isLocalCurrencyLoan ? null :
                                            <>
                                                )
                                            </>
                                        }
                                    </div>

                                </Fragment>
                            ),
                        )}
                    </div>
                </>
            )}

            <div>
                <h4>Total Repaid:</h4>
                <div>
                    {!borrowerInfoState?.isLocalCurrencyLoan ? null :
                        <>
                            {formatToken(
                                BigNumber.from(details.totalAmountRepaid)
                                    .mul((Number(borrowerInfoState.localDetail.fxRate) * 100).toFixed(0))
                                    .div(100),
                                liquidityTokenDecimals,
                                2,
                                true,
                            )}{' '}
                            {borrowerInfoState.localDetail.localCurrencyCode}
                            {' '}
                            (
                        </>
                    }
                    {formatToken(
                        details.totalAmountRepaid,
                        liquidityTokenDecimals,
                        2,
                        false
                    )}{' '}
                    {TOKEN_SYMBOL}
                    {!borrowerInfoState?.isLocalCurrencyLoan ? null :
                        <>
                            )
                        </>
                    }
                </div>
            </div>

            {showCloseModal ? (
                <Modal onClose={() => {setShowCloseModal(false)}}>
                    <h3 style={{ textAlign: 'center' }}>
                        Close loan
                    </h3>

                    <div className="stats">
                        <div className="item">
                            <div className="label">Borrower</div>
                            <div className="value">
                                {borrowerInfoState?.name ?? "..."}
                            </div>
                        </div>
                        <div className="item">
                            <div className="label">Account</div>
                            <div className="value">
                                <EtherscanAddress address={borrower} />
                            </div>
                        </div>
                        <div className="item">
                            <div className="label">Approved</div>
                            <div className="value">
                                <TimeAgo datetime={borrowedTime * 1000} />
                            </div>
                        </div>
                        <div className="item">
                            <div className="label">Remaining</div>
                            <div className="value">
                                <Remaining timestamp={borrowedTime + duration} noHoursAndLess={true} />
                            </div>
                        </div>
                        <div className="item">
                            <div className="label">Principal</div>
                            <div className="value">
                                {formatToken(amount, liquidityTokenDecimals, 2, true)}{' '}
                                {TOKEN_SYMBOL}
                            </div>
                        </div>

                        <div className="item">
                            <div className="label">Principal Outstanding</div>
                            <div className="value">
                                {formatToken(
                                    BigNumber.from(loan.amount).sub(details.baseAmountRepaid),
                                    liquidityTokenDecimals,
                                    2,
                                    false
                                )}{' '}
                                {TOKEN_SYMBOL}
                            </div>
                        </div>
                    </div>
                    <div className="stats">
                        <div className="item">
                            <div className="label">Manager&apos;s Revenue</div>
                            <div className="value">
                                {formatToken(
                                    managerEarnings ?? zero,
                                    liquidityTokenDecimals,
                                    2,
                                    false
                                )}{' '}
                                {TOKEN_SYMBOL}
                            </div>
                        </div>

                        <div className="item">
                            <div className="label">Manager&apos;s Stake</div>
                            <div className="value">
                                {formatToken(
                                    managerStake ?? zero,
                                    liquidityTokenDecimals,
                                    2,
                                    false
                                )}{' '}
                                {TOKEN_SYMBOL}
                            </div>
                        </div>
                    </div>

                    <div style={{margin:'24px'}}>
                        <Alert
                            style="warning"
                            title="Closing this loan will repay the outstanding principal using the pool manager's revenue
                            and/or staked funds. If these funds are not sufficient, the lenders will take the loss."
                        />
                    </div>
                    <Button
                        type="button"
                        loading={closeLoading}
                        disabled={closeLoading}
                        style={{ display: 'flex', margin: '24px auto 20px' }}
                        onClick={() => {
                            setCloseLoading(true)
                            contract
                                .attach(poolAddress)
                                .connect(provider!.getSigner())
                                .closeLoan(
                                    loan.id
                                )
                                .then((tx) =>
                                    trackTransaction(dispatch, {
                                        name: `Request loan for ${amount} ${TOKEN_SYMBOL}`,
                                        tx,
                                    }),
                                )
                                .then((action) => {
                                    setShowCloseModal(false)
                                    setCloseLoading(false)
                                })
                                .catch((error) => {
                                    console.error(error)
                                    setShowCloseModal(false)
                                    setCloseLoading(false)
                                })
                        }}
                    >
                        Confirm Close Loan
                    </Button>
                </Modal>
            ) : (
                false
            )}
            { showRepayModal ?
                <Modal onClose={() => {setShowRepayModal(false)}}>
                    <RepayLoanOnBehalf
                        key={loan.id}
                        pool={pool}
                        poolAddress={poolAddress}
                        loan={loan}
                        provider={provider}
                        dispatch={dispatch}
                        account={account}
                    />
                </Modal>
            : null
            }

        </div>
    )
}

function RepayLoanOnBehalf({
    pool: { liquidityTokenAddress, liquidityTokenDecimals, loanDeskAddress },
    poolAddress,
    loan,
    provider,
    dispatch,
    account,
}: {
    pool: Pool
    poolAddress: Address
    loan: ReturnType<typeof useLoans>[number]
    provider: ReturnType<typeof useProvider>
    dispatch: AppDispatch
    account: Address | undefined
}) {
    const [amount, setAmount] = useState<InputAmount>('')

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
        profileId: string
        applicationId: number
        name: string
        businessName: string
        phone?: string
        email?: string
        isLocalCurrencyLoan?: boolean
        localDetail?: LocalDetail
    } | null>(null)
    const contactDetails =
        contactDetailsState &&
        contactDetailsState.applicationId === loan.applicationId
            ? contactDetailsState
            : null
    useEffect(() => {
        loanDeskContract
            .attach(loanDeskAddress)
            .loanApplications(loan.applicationId)
            .then(({ profileId }) =>
                getBorrowerInfo(loan.applicationId).then((info) =>
                    // temporarily ignore cached entries
                    // info
                    //     ? { info, profileId }
                    //     :
                    fetch(`${BORROWER_SERVICE_URL}/profile/${profileId}`)
                        .then(
                            (response) =>
                                response.json() as Promise<{
                                    name: string
                                    businessName: string
                                    phone?: string
                                    email?: string
                                    isLocalCurrencyLoan?: boolean
                                    localDetail: LocalDetail
                                }>,
                        )
                        .then(
                            (info) => (
                                setBorrowerInfo(loan.applicationId, info),
                                    { info, profileId }
                            ),
                        ),
                ),
            )
            .then(({ info, profileId }) =>
                setContactDetailsState({
                    ...info,
                    profileId,
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

            const amountBigNumber = parseUnits(amount, liquidityTokenDecimals)

            if (needsApproval) {
                getERC20Contract(liquidityTokenAddress)
                    .connect(signer)
                    .approve(poolAddress, amountBigNumber)
                    .then((tx) =>
                        trackTransaction(dispatch, {
                            name: `Step 1 of 2 ➜ Approve ${TOKEN_SYMBOL}`,
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
                .repayOnBehalf(BigNumber.from(loan.id), amountBigNumber, loan.borrower)
                .then((tx) =>
                    trackTransaction(dispatch, {tx, name: 'Repay loan'}),
                )
                .then(() =>
                    dispatch(fetchLoan({poolAddress, loanId: loan.id})),
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

    const schedule = useSimpleSchedule(
        wasRepaid ? null : loan,
        BigNumber.from((Number(contactDetailsState?.localDetail?.localInstallmentAmount ?? 0) * 1000000).toFixed(0)),
        contactDetailsState?.localDetail?.fxRate ?? 1)

    const largerThanZero = Number(amount) > 0

    return (
        <>
            <form className="main" onSubmit={handleRepay}>
                <Box
                    className="repay"
                    overlay={
                        loan.status === LoanStatus.REPAID
                            ? 'Loan fully repaid'
                            : undefined
                    }
                >
                    <h2>Repay Loan on Behalf</h2>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={amount}
                        onChange={setAmount}
                    />
                    <Button
                        type="submit"
                        loading={isLoading}
                        disabled={!largerThanZero || isLoading}
                    >
                        {needsApproval && largerThanZero
                            ? `Step 1 of 2 ➜ Approve ${TOKEN_SYMBOL}`
                            : !(!largerThanZero || isLoading)
                                ? 'Final Step ➜ Repay'
                                : 'Repay'
                        }
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
                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                            <>
                                {formatToken(
                                    BigNumber.from((Number(contactDetailsState.localDetail?.localLoanAmount) * 100).toFixed(0)),
                                    2,
                                    2,
                                    true,
                                )}{' '}
                                {contactDetailsState.localDetail?.localCurrencyCode}
                                {' '}
                                (
                            </>
                        }
                        {formatToken(loan.amount, liquidityTokenDecimals, 2, true)}{' '}
                        {TOKEN_SYMBOL}
                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                            <>
                                )
                            </>
                        }
                    </div>
                    <div className="field">
                        <span className="label">Repaid:</span>{' '}
                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                            <>
                                {formatToken(
                                    repaid.mul((Number(contactDetailsState.localDetail?.fxRate) * 100).toFixed(0)).div(100),
                                    liquidityTokenDecimals,
                                    2,
                                    true,
                                )}{' '}
                                {contactDetailsState.localDetail?.localCurrencyCode}
                                {' '}
                                (
                            </>
                        }
                        {formatToken(repaid, liquidityTokenDecimals, 2, true)}{' '}
                        {TOKEN_SYMBOL}
                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                            <>
                                )
                            </>
                        }
                    </div>
                    <div className="field">
                        <span className="label">Total interest paid:</span>{' '}
                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                            <>
                                {formatToken(
                                    BigNumber.from(loan.details.interestPaid).mul((Number(contactDetailsState.localDetail?.fxRate) * 100).toFixed(0)).div(100),
                                    liquidityTokenDecimals,
                                    2,
                                    true,
                                )}{' '}
                                {contactDetailsState.localDetail?.localCurrencyCode}
                                {' '}
                                (
                            </>
                        }
                        {formatToken(
                            loan.details.interestPaid,
                            liquidityTokenDecimals,
                            2,
                            true
                        )}{' '}
                        {TOKEN_SYMBOL}
                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                            <>
                                )
                            </>
                        }
                    </div>
                    {
                        // TODO: Display time remaining and start date instead of duration
                    }
                    <div className="field">
                        <span className="label">Duration:</span>{' '}
                        {loan.duration / thirtyDays} months
                    </div>
                    <div className="field">
                        <span className="label">Interest APR:</span>{' '}
                        {formatPercent(loan.apr / 100)}
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
                    {
                        /*
                        contactDetails &&
                        !contactDetails.phone &&
                        !contactDetails.email ? (
                            <Button
                                type="button"
                                stone
                                onClick={async () => {
                                    const info =
                                        await fetchBorrowerInfoAuthenticated(
                                            poolAddress,
                                            loan.applicationId,
                                            contactDetails.profileId,
                                            account!,
                                            provider!.getSigner(),
                                        )
                                    setContactDetailsState({
                                        ...contactDetails,
                                        ...info,
                                    })
                                }}
                            >
                                Get contact information
                            </Button>
                        ) : null
                        */
                    }
                </Box>
            </form>

            {wasRepaid ? null : (
                <Box>
                    <h3>Re-Payment Schedule</h3>

                    <div className="schedule">
                        <div className="label">Due</div>
                        <div className="label">Amount</div>

                        {schedule.map((item, index) =>
                            item.skip ? null : (
                                <Fragment key={index}>
                                    <div>
                                        {item.date}
                                    </div>
                                    <div>
                                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                                            <>
                                                {formatToken(
                                                    item.localAmount,
                                                    liquidityTokenDecimals,
                                                    2,
                                                    true,
                                                )}{' '}
                                                {contactDetailsState.localDetail?.localCurrencyCode}
                                                {' '}
                                                (
                                            </>
                                        }
                                        {formatToken(
                                            item.amount,
                                            liquidityTokenDecimals,
                                            2,
                                            true,
                                        )}{' '}
                                        {TOKEN_SYMBOL}
                                        {!contactDetailsState?.isLocalCurrencyLoan ? null :
                                            <>
                                                )
                                            </>
                                        }
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

const zeroMinutes = Duration.fromObject({ minutes: 0 }).toHuman()
function Remaining({ timestamp, noHoursAndLess }: { timestamp: number, noHoursAndLess?: boolean }) {
    const [integer, setInteger] = useState(0) // Force update
    const value = useMemo(
        () => (noop(integer), formatRemaining(timestamp, noHoursAndLess)),
        [timestamp, integer, noHoursAndLess],
    )

    useEffect(() => {
        if (value === zeroMinutes) return

        // Will update every minute
        const timeoutId = setTimeout(() => {
            setInteger((i) => i + 1)
        }, 60_000)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [value, timestamp])

    return (value === zeroMinutes ? '-' : value) as unknown as JSX.Element
}

function formatRemaining(timestamp: number, noHoursAndLess?: boolean) {
    const now = Date.now() / 1000
    if (now > timestamp) return zeroMinutes

    return formatDuration(timestamp - now, true, noHoursAndLess, noHoursAndLess)
}

function onlyPositive<T, R extends { [key in keyof T]?: number }>(
    object: R,
): R {
    const newObject = {} as R

    for (const i in object) {
        const value = object[i]
        if (value <= 0) continue
        newObject[i] = value
    }

    return newObject
}

function formatDuration(duration: number, noSeconds?: boolean, noMinutes?: boolean, noHours?: boolean): string {
    const result = onlyPositive(
        Duration.fromObject({
            years: 0,
            weeks: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: duration,
        })
            .normalize()
            .toObject(),
    )

    if (noSeconds) delete result.seconds
    if (noMinutes) delete result.minutes
    if (noHours) delete result.hours

    return Duration.fromObject(result).toHuman()
}

export function formatDurationInMonths(duration: number): number {
    return duration / thirtyDays
}
