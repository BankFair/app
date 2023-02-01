import { parseUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
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
    Address,
    APP_NAME,
    BORROWER_SERVICE_URL,
    chains,
    CHAIN_ID,
    checkAmountValidity,
    convertPercent,
    fetchBorrowerInfoAuthenticated,
    formatPercent,
    formatToken,
    getAddress,
    getBorrowerInfo,
    getERC20Contract,
    InputAmount,
    oneDay,
    oneYear,
    poolsConfig,
    prefix,
    rgbRed,
    rgbYellowDarker,
    rgbYellowLighter,
    setBorrowerInfo,
    shortenAddress,
    thirtyDays,
    TOKEN_SYMBOL,
    useAccount,
    useAmountWithInterest,
    useProvider,
    zero,
    zeroHex,
    USD_TO_UGX_FX,
    UGX_CODE,
    LocalDetail,
} from '../../app'
import {
    Alert,
    AmountInput,
    BackToPools,
    Box,
    Button,
    ConnectModal,
    Modal,
    Page,
    PageLoading,
    ScheduleSummary,
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
    Loan,
    useSimpleSchedule,
} from '../../features'
import { AppDispatch, useDispatch, useSelector } from '../../store'

const title = `Borrow - ${APP_NAME}`

const Borrow: NextPage<{ address: string }> = ({ address }) => {
    const account = useAccount()
    const provider = useProvider()
    const dispatch = useDispatch()
    const pool = useSelector((s) => s.pools[address])
    const name = poolsConfig.find((pool) => pool.address === address)?.name

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href={`${prefix}/favicon.svg`} />
        </Head>
    )

    const offer = useOffer(account, provider, pool)
    const loans = useLoans(address, account)
    const outstandingLoans = useMemo(
        () => loans.filter((l) => l.status === LoanStatus.OUTSTANDING),
        [loans],
    )

    useLoadAccountLoans(address, account, dispatch, pool)
    // const accountLoaded = pool?.loadedAccounts[account || '']

    if (!pool) {
        // TODO: Add `|| !accountLoaded || offer === undefined` when we migrate to an indexer
        return <PageLoading>{head}</PageLoading>
    }

    return (
        <Page>
            {head}

            <BackToPools href="/borrow" />
            <h1>{name}</h1>
            <RepayLoans
                pool={pool}
                poolAddress={address as Address}
                account={account}
                loans={loans}
            />
            <Offer
                pool={pool}
                poolAddress={address}
                account={account}
                offer={offer}
            />
            {!offer ? (
                <RequestLoan
                    pool={pool}
                    poolAddress={address}
                    account={account}
                />
            ) : null}
        </Page>
    )
}

Borrow.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Borrow

interface Offer {
    details: LoanOffer
    account: string
    contactDetails: {
        name: string
        businessName: string
        phone?: string
        email?: string
        isLocalCurrencyLoan?: boolean
        localDetail: LocalDetail
    }
    loanDeskAddress: string
}
function useOffer(
    account: string | undefined,
    provider: ReturnType<typeof useProvider>,
    pool: Pool | undefined,
) {
    const [offer, setOffer] = useState<Offer | null | undefined>()
    const offerRef = useRef<string | undefined>()
    useEffect(() => {
        if (!account || !pool || !provider) return
        if (account === offerRef.current) return
        offerRef.current = account

        const contract = loanDeskContract.attach(pool.loanDeskAddress)

        const max = CHAIN_ID === chains.mumbai ? 80 : 60
        for (let i = 1; i <= max; i++) {
            contract
                .loanApplications(i)
                .then(async (request) => {
                    if (request.borrower !== account) return
                    if (request.status !== LoanApplicationStatus.OFFER_MADE) {
                        setOffer(null)
                        return
                    }

                    const [offer, contactDetails] = await Promise.all([
                        contract.loanOffers(request.id),
                        getBorrowerInfo(request.id.toNumber()).then((info) =>
                            info
                                ? info
                                : fetch(
                                      `${BORROWER_SERVICE_URL}/profile/${request.profileId}`,
                                  )
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
                                              setBorrowerInfo(
                                                  request.id.toNumber(),
                                                  info,
                                              ),
                                              info
                                          ),
                                      ),
                        ),
                    ])

                    setOffer({
                        details: offer,
                        account,
                        loanDeskAddress: pool.loanDeskAddress,
                        contactDetails: contactDetails || {},
                    })
                })
                .catch((error) => {
                    console.error(error)
                })
        }
    }, [account, pool, provider])

    return offer
}

function Offer({
    pool: { loanDeskAddress, liquidityTokenDecimals, block },
    poolAddress,
    account,
    offer,
}: {
    pool: Pool
    poolAddress: string
    account: string | undefined
    offer: Offer | null | undefined
}) {
    const provider = useProvider()
    const dispatch = useDispatch()

    const [isLoading, setIsLoading] = useState(false)
    const [isAccepted, setIsAccepted] = useState(false)

    const [isLocalCurrencyLoan, setLocalCurrencyLoan] = useState(offer?.contactDetails?.isLocalCurrencyLoan ?? false);
    const [fxRate, setFxRate] = useState(offer?.contactDetails?.isLocalCurrencyLoan ? offer.contactDetails?.localDetail.fxRate : 1);

    const [monthly, scheduleArg] = useMemo<
        [boolean, Parameters<typeof useSimpleSchedule>[0]]
    >(() => {
        if (!offer) return [false, null]
        const { amount, apr, duration, installments, installmentAmount } =
            offer.details
        const now = Math.trunc(Date.now() / 1000)
        const durationNumber = duration.toNumber()
        return [
            durationNumber % thirtyDays === 0 &&
                installments === durationNumber / thirtyDays,
            {
                amount,
                apr: convertPercent(apr),
                installments,
                installmentAmount,
                duration: durationNumber,
                borrowedTime: now,
                details: {
                    baseAmountRepaid: zeroHex,
                    totalAmountRepaid: zeroHex,
                    interestPaid: zeroHex,
                    interestPaidUntil: now,
                },
            },
        ]
    }, [offer])
    const schedule = useSimpleSchedule(
        scheduleArg,
        BigNumber.from((Number(offer?.contactDetails?.localDetail.localInstallmentAmount ?? 0) * 1000000).toFixed(0)),
        Number(fxRate)
    )

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
                    {!isLocalCurrencyLoan ? null :
                        <>
                            {formatToken(
                                offer.details.amount.mul((Number(fxRate) * 100).toFixed(0)).div(100),
                                liquidityTokenDecimals,
                                2,
                                true,
                            )}{' '}
                            {}
                            {' '}
                            (
                        </>
                    }
                    {formatToken(offer.details.amount, liquidityTokenDecimals)}{' '}
                    {TOKEN_SYMBOL}
                    {!isLocalCurrencyLoan ? null :
                        <>
                            )
                        </>
                    }
                </div>
            </div>
            <div className="field">
                <div className="label">Installment amount</div>
                <div>
                    {!isLocalCurrencyLoan ? null :
                        <>
                            {formatToken(
                                offer.details.amount.mul((Number(fxRate) * 100).toFixed(0)).div(100),
                                liquidityTokenDecimals,
                                2,
                                true,
                            )}{' '}
                            {offer.contactDetails?.localDetail.localCurrencyCode}
                            {' '}
                            (
                        </>
                    }
                        {formatToken(
                            offer.details.installmentAmount,
                            liquidityTokenDecimals,
                            2,
                            true
                        )}{' '}
                        {TOKEN_SYMBOL}
                    {!isLocalCurrencyLoan ? null :
                        <>
                            )
                        </>
                    }
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
                <div>{formatPercent(offer.details.apr / 1000)}</div>
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

            <div className="schedule-container">
                <ScheduleSummary
                    amount={offer.details.amount}
                    monthly={monthly}
                    schedule={schedule}
                    liquidityTokenDecimals={liquidityTokenDecimals}
                    isLocalCurrencyLoan={offer.contactDetails.isLocalCurrencyLoan ?? false}
                    localDetail={offer.contactDetails.localDetail}
                />

                <div className="schedule-notice">
                    If the details above are incorrect do not proceed. Contact
                    the pool manager to update the offer.
                </div>
            </div>

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

                .schedule-container {
                    color: ${rgbYellowDarker};
                    background-color: ${rgbYellowLighter};
                    margin-top: 16px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-weight: 600;

                    > .schedule-notice {
                        margin-top: 16px;
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
    loans,
}: {
    pool: Pool
    poolAddress: Address
    account: Address | undefined
    loans: Loan[]
}) {
    const provider = useProvider()
    const dispatch = useDispatch()

    return loans
        .sort((a, b) => b.id - a.id)
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
                .repay(BigNumber.from(loan.id), amountBigNumber)
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

    const schedule = useSimpleSchedule(
        wasRepaid ? null : loan,
        BigNumber.from((Number(contactDetailsState?.localDetail?.localInstallmentAmount ?? 0) * 1000000).toFixed(0)),
        contactDetailsState?.localDetail?.fxRate ?? 1)

    const largerThanZero = Number(amount) > 0

    return (
        <>
            <Box>
                <h2>Loan Status</h2>
                <div className="stats">
                    <div className="stat">
                        <div className="label">Outstanding</div>
                        <div className="value">
                            {!contactDetailsState?.isLocalCurrencyLoan ? null :
                                <>
                                    {formatToken(
                                        outstandingNow.mul((Number(contactDetailsState.localDetail?.fxRate) * 100).toFixed(0)).div(100),
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
                                outstandingNow,
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

const initialValue = ''
const initialDuration = ''
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

    const [amount, setAmount] = useState<InputAmount>(initialValue)
    const [amountLocal, setAmountLocal] = useState<InputAmount>(initialValue)

    const updateAmountLocal = (input:InputAmount) => {
        setAmountLocal(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        setAmount((inputNum / USD_TO_UGX_FX).toFixed(2) as InputAmount)
    }

    const updateAmount = (input:InputAmount) => {
        setAmount(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        setAmountLocal((inputNum * USD_TO_UGX_FX).toFixed(2) as InputAmount)
    }

    const [duration, setDuration] = useState<InputAmount>(initialDuration)
    const durationMultiplier = thirtyDays

    const { invalidAmountLocalMessage, invalidAmountMessage, invalidDurationMessage } = useMemo(() => {
        if (!borrowInfo) {
            return {
                invalidAmountMessage: '',
                invalidAmountLocalMessage: '',
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

        const isAmountLocalValid = checkAmountValidity(
            amountLocal,
            liquidityTokenDecimals,
            BigNumber.from(borrowInfo.minLoanAmount).mul(USD_TO_UGX_FX),
        )

        return {
            invalidAmountMessage: isAmountValid
                ? ''
                : `Minimum amount is ${formatToken(
                      BigNumber.from(borrowInfo.minLoanAmount),
                      liquidityTokenDecimals,
                  )}`,
            invalidAmountLocalMessage: isAmountLocalValid
                ? ''
                : `Minimum amount is ${formatToken(
                    BigNumber.from(borrowInfo.minLoanAmount).mul(USD_TO_UGX_FX),
                    liquidityTokenDecimals,
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

    const [nameBlurred, setNameBlurred] = useState(false)
    const isNameInvalid = !checkValidityNotEmpty(name)
    const [businessNameBlurred, setBusinessNameBlurred] = useState(false)
    const isBusinessNameInvalid = !checkValidityNotEmpty(businessName)
    const [phoneBlurred, setPhoneBlurred] = useState(false)
    const [emailBlurred, setEmailBlurred] = useState(false)
    const isPhoneAndEmailEmpty =
        !checkValidityNotEmpty(email) && !checkValidityNotEmpty(phone)
    const [isEmailInvalid, setIsEmailInvalid] = useState(false)
    const [amountLocalBlurred, setAmountLocalBlurred] = useState(false)
    const [amountBlurred, setAmountBlurred] = useState(false)
    const [durationBlurred, setDurationBlurred] = useState(false)

    const isManager = managerAddress === account
    const componentIsLoading =
        !borrowInfo || Boolean(account && !loanPendingApproval)
    const disabled = isManager || componentIsLoading
    const disabledSubmit = Boolean(
        loading ||
            disabled ||
            !amountLocal ||
            !amount ||
            isNameInvalid ||
            isBusinessNameInvalid ||
            isPhoneAndEmailEmpty ||
            isEmailInvalid ||
            invalidAmountMessage ||
            invalidAmountLocalMessage ||
            invalidDurationMessage ||
            isLoanPendingApproval ||
            isSubmitted,
    )

    const [stepTwo, setStepTwo] = useState<{
        parsedAmount: BigNumber
        parsedDuration: BigNumber
        id: string
        digest: string

        name: string
        businessName: string
        phone?: string
        email?: string
    } | null>(null)
    const [stepTwoLoading, setStepTwoLoading] = useState(false)

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
                            poolAddress,
                            isLocalCurrencyLoan: true,
                            localDetail :{
                                localLoanAmount: amountLocal,
                                localCurrencyCode: UGX_CODE,
                                fxRate: USD_TO_UGX_FX,
                            },
                        }),
                    }),
                )
                .then(
                    (response) =>
                        response.json() as Promise<{
                            id: string
                            digest: string
                        }>,
                )
                .then(({ id, digest }) =>
                    setStepTwo({
                        parsedAmount,
                        parsedDuration,
                        id,
                        digest,

                        name,
                        businessName,
                        phone,
                        email,
                    }),
                )
                .catch((error) => {
                    console.error(error)
                    setLoading(false)
                })
        },
        [
            account,
            disabledSubmit,
            amount,
            amountLocal,
            liquidityTokenDecimals,
            duration,
            durationMultiplier,
            provider,
            name,
            businessName,
            phone,
            email,
            poolAddress,
        ],
    )

    return (
        <Box
            loading={componentIsLoading}
            overlay={
                !account ? (
                    <Button
                        type="button"
                        onClick={() => setShowConnectModal(true)}
                    >
                        Connect Wallet
                    </Button>
                ) : isManager ? (
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
                        z-index: 5;
                        position: relative;
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

                        > input {
                            display: block;
                        }

                        > :global(.alert) {
                            margin-top: 8px;
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
                        className={
                            nameBlurred && isNameInvalid ? 'invalid' : ''
                        }
                        required={Boolean(account)}
                        placeholder="John Smith"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onBlur={() => setNameBlurred(true)}
                    />
                    {nameBlurred && isNameInvalid ? (
                        <Alert style="error" title="Please enter your name" />
                    ) : null}
                </label>
                <label>
                    <div className="label">Business Name</div>
                    <input
                        type="text"
                        className={
                            businessNameBlurred && isBusinessNameInvalid
                                ? 'invalid'
                                : ''
                        }
                        required={Boolean(account)}
                        placeholder="Green LLC"
                        value={businessName}
                        onChange={(event) =>
                            setBusinessName(event.target.value)
                        }
                        onBlur={() => setBusinessNameBlurred(true)}
                    />
                    {businessNameBlurred && isBusinessNameInvalid ? (
                        <Alert
                            style="error"
                            title="Please enter your business name"
                        />
                    ) : null}
                </label>
                <label>
                    <div className="label">Phone</div>
                    <input
                        type="tel"
                        className={
                            phoneBlurred && emailBlurred && isPhoneAndEmailEmpty
                                ? 'invalid'
                                : ''
                        }
                        placeholder="+1 (555) 343-3411"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        onBlur={() => setPhoneBlurred(true)}
                    />
                </label>
                <label>
                    <div className="label">Email</div>
                    <input
                        type="email"
                        className={
                            phoneBlurred &&
                            emailBlurred &&
                            (isPhoneAndEmailEmpty || isEmailInvalid)
                                ? 'invalid'
                                : ''
                        }
                        placeholder="johnsmith@gmail.com"
                        value={email}
                        onChange={(event) => {
                            const newValue = event.target.value
                            setEmail(newValue)

                            setIsEmailInvalid(
                                Boolean(
                                    newValue && !event.target.checkValidity(),
                                ),
                            )
                        }}
                        onBlur={() => setEmailBlurred(true)}
                    />
                    {phoneBlurred && emailBlurred ? (
                        isPhoneAndEmailEmpty ? (
                            <Alert
                                style="error"
                                title="Please enter an email or phone number"
                            />
                        ) : isEmailInvalid ? (
                            <Alert style="error" title="Invalid email" />
                        ) : null
                    ) : null}
                </label>

                <label>
                    <div className="label">Amount in Local Currency</div>
                    <AmountInput
                        invalid={amountLocalBlurred && Boolean(invalidAmountLocalMessage)}
                        decimals={2}
                        value={amountLocal}
                        onChange={updateAmountLocal}
                        disabled={disabled}
                        onBlur={() => setAmountLocalBlurred(true)}
                        onKeyDown={(event) =>
                            event.key === 'Enter'
                                ? setAmountLocalBlurred(true)
                                : undefined
                        }
                        currency={UGX_CODE}
                    />
                    {amountLocalBlurred && invalidAmountLocalMessage ? (
                        <Alert style="error" title={invalidAmountLocalMessage} />
                    ) : null}
                </label>
                <label>
                    <div className="label">Amount</div>
                    <AmountInput
                        invalid={amountBlurred && Boolean(invalidAmountMessage)}
                        decimals={2}
                        value={amount}
                        onChange={updateAmount}
                        disabled={disabled}
                        onBlur={() => setAmountBlurred(true)}
                        onKeyDown={(event) =>
                            event.key === 'Enter'
                                ? setAmountBlurred(true)
                                : undefined
                        }
                    />
                    {amountBlurred && invalidAmountMessage ? (
                        <Alert style="error" title={invalidAmountMessage} />
                    ) : null}
                </label>
                <label>
                    <div className="label">FX Rate, 1 USDT = </div>
                    <input
                        type="text"
                        disabled
                        value={USD_TO_UGX_FX + ' UGX'}
                    />
                </label>
                <label>
                    <div className="label">Duration</div>
                    <AmountInput
                        decimals={4}
                        value={duration}
                        onChange={setDuration}
                        invalid={
                            durationBlurred && Boolean(invalidDurationMessage)
                        }
                        onBlur={() => setDurationBlurred(true)}
                        disabled={disabled}
                        noToken
                        label="months"
                        paddingRight={60}
                        onKeyDown={(event) =>
                            event.key === 'Enter'
                                ? setDurationBlurred(true)
                                : undefined
                        }
                    />
                    {durationBlurred && invalidDurationMessage ? (
                        <Alert style="error" title={invalidDurationMessage} />
                    ) : null}
                </label>

                <div className="button-container">
                    <Button
                        type="submit"
                        disabled={disabledSubmit}
                        loading={loading}
                    >
                        Request Loan
                    </Button>

                    {/* Disabled elements prevent any click events to be fired resulting in inputs not being blurred */}
                    {account && disabledSubmit ? (
                        <div
                            className="clickable"
                            onClick={() => {
                                setNameBlurred(true)
                                setBusinessNameBlurred(true)
                                setPhoneBlurred(true)
                                setEmailBlurred(true)
                                setAmountLocalBlurred(true)
                                setAmountBlurred(true)
                                setDurationBlurred(true)
                            }}
                        />
                    ) : null}
                </div>
            </form>

            {showConnectModal ? (
                <ConnectModal onClose={() => setShowConnectModal(false)} />
            ) : null}

            {stepTwo ? (
                <Modal
                    onClose={() => {
                        setStepTwoLoading(false)
                        setLoading(false)
                        setStepTwo(null)
                    }}
                >
                    <p style={{ textAlign: 'center' }}>
                        Signature accepted. Press submit request to continue.
                    </p>
                    <Button
                        type="button"
                        loading={stepTwoLoading}
                        disabled={stepTwoLoading}
                        style={{ display: 'flex', margin: '0 auto 20px' }}
                        onClick={() => {
                            setStepTwoLoading(true)
                            loanDeskContract
                                .attach(loanDeskAddress)
                                .connect(provider!.getSigner())
                                .requestLoan(
                                    stepTwo.parsedAmount,
                                    stepTwo.parsedDuration,
                                    stepTwo.id,
                                    stepTwo.digest,
                                )
                                .then((tx) =>
                                    trackTransaction(dispatch, {
                                        name: `Request loan for ${amount} ${TOKEN_SYMBOL}`,
                                        tx,
                                    }),
                                )
                                .then((action) => {
                                    setIsSubmitted(true)
                                    setLoading(false)
                                    setStepTwo(null)
                                    setStepTwoLoading(false)

                                    const event =
                                        action.payload.receipt.events?.[0]
                                    if (
                                        event?.eventSignature ===
                                        'LoanRequested(uint256,address)'
                                    ) {
                                        setBorrowerInfo(
                                            BigNumber.from(
                                                event!.args!.array[0],
                                            ).toNumber(),
                                            {
                                                name: stepTwo!.name,
                                                businessName:
                                                    stepTwo!.businessName,
                                                phone: stepTwo!.phone,
                                                email: stepTwo!.email,
                                                isLocalCurrencyLoan: true,
                                                localDetail :{
                                                    localLoanAmount: amountLocal,
                                                    localCurrencyCode: UGX_CODE,
                                                    fxRate: USD_TO_UGX_FX,
                                                    localInstallmentAmount: "0"
                                                },
                                            },
                                        )
                                    }
                                })
                                .catch((error) => {
                                    console.error(error)
                                    setStepTwoLoading(false)
                                })
                        }}
                    >
                        Submit Request
                    </Button>
                </Modal>
            ) : (
                false
            )}
        </Box>
    )
}

function checkValidityNotEmpty(value: string) {
    return Boolean(value.trim())
}
