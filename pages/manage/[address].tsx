import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
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
    APP_NAME,
    useAccount,
    getAddress,
    prefix,
    useProvider,
    BORROWER_SERVICE_URL,
    TOKEN_SYMBOL,
    rgbGreen,
    thirtyDays,
    oneDay,
    getInstallmentAmount,
    getBorrowerMetadata,
    setBorrowerInfo,
    InputAmount,
    formatInputAmount,
    formatToken,
    zeroHex,
    zero,
    rgbYellowDarker,
    rgbYellowLighter,
    checkAmountValidity,
    checkAmountMaxValidity,
    oneYear,
    amountWithInterest,
    chains,
    CHAIN_ID,
    Address,
    LocalDetail,
    authenticateUser,
    SIDEBAR_ALWAYS_VISIBLE_WIDTH, formatNumberInputAmount,
} from '../../app'
import {
    Alert,
    AmountInput,
    BackToPools,
    Box,
    Button,
    EtherscanAddress,
    ExitAlert,
    formatDurationInMonths,
    Loans,
    Modal,
    Page,
    PageLoading,
    ScheduleSummary,
    Tabs,
    useAmountForm,
} from '../../components'
import {
    BorrowInfo,
    fetchBorrowInfo,
    getBatchProviderAndLoanDeskContract,
    LoanApplicationStatus,
    loanDeskContract,
    Pool,
    refetchStatsIfUsed,
    trackTransaction,
    useManagerInfo, usePoolLiquidity,
    useSimpleSchedule,
    useStatsState,
} from '../../features'
import { useDispatch, useSelector } from '../../store'
import { Oval } from 'react-loading-icons'
import {types} from "sass";

const title = `Earn - ${APP_NAME}`

const Manage: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const account = useAccount()

    const dispatch = useDispatch()
    const dispatchRef = useRef('')
    useEffect(() => {
        if (!pool) return
        if (dispatchRef.current === address) return
        dispatchRef.current = address
        dispatch(
            fetchBorrowInfo({
                poolAddress: address,
                loanDeskAddress: pool.loanDeskAddress,
            }),
        )
    }, [address, dispatch, pool])

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href={`${prefix}/favicon.svg`} />
        </Head>
    )

    if (!pool || !pool.borrowInfo) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <BackToPools href="/manage" />
            <h1>{pool.name}</h1>
            {pool ? (
                pool.managerAddress === account ? (
                    <>
                        <LoansAwaitingApproval
                            pool={pool}
                            poolAddress={address as Address}
                            account={account}
                        />
                        <Loans pool={pool} poolAddress={address as Address} />
                    </>
                ) : (
                    <h3>Login with manager wallet</h3>
                )
            ) : (
                <h3>Loading…</h3>
            )}
        </Page>
    )
}

Manage.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Manage

interface BaseLoanRequest {
    id: number
    borrower: string
    amount: BigNumber // Will never change
    duration: BigNumber // Will never change
    name: string
    businessName: string
    status: LoanApplicationStatus
    profileId: string
    phone?: string
    email?: string
    isLocalCurrencyLoan?: boolean
    localDetail: LocalDetail
}
interface OfferValues {
    amount: BigNumber
    duration: BigNumber
    graceDefaultPeriod: number
    installmentAmount: BigNumber
    installments: number
    interest: number
    lockedTime: number
}

type LoanRequest =
    | (BaseLoanRequest & {
          status: LoanApplicationStatus.APPLIED
      })
    | (BaseLoanRequest & {
          status: LoanApplicationStatus.DENIED
      })
    | (BaseLoanRequest &
        OfferValues & {
            status: LoanApplicationStatus.OFFER_DRAFTED
        })
    | (BaseLoanRequest &
        OfferValues & {
            status: LoanApplicationStatus.OFFER_DRAFT_LOCKED
        })
    | (BaseLoanRequest &
          OfferValues & {
              status: LoanApplicationStatus.OFFER_MADE
          })
    | (BaseLoanRequest &
          OfferValues & {
              status: LoanApplicationStatus.CANCELLED
          })
    | (BaseLoanRequest &
          OfferValues & {
              status: LoanApplicationStatus.OFFER_ACCEPTED
          })
function LoansAwaitingApproval({
    pool: { loanDeskAddress, liquidityTokenDecimals, block, borrowInfo },
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: Address
    account: Address
}) {
    const dispatch = useDispatch()
    const provider = useProvider()
    const [requests, setRequests] = useState<LoanRequest[] | null>(null)
    useEffect(() => {
        let canceled = false

        const contract = loanDeskContract.attach(loanDeskAddress)
        const directQueryContract = loanDeskContract.attach(loanDeskAddress)


        const toLoad = CHAIN_ID === chains.mumbai ? 80 : 40
        const { loanDeskContract: attached } = getBatchProviderAndLoanDeskContract(
            toLoad,
            contract,
        )

        Promise.all(
            Array.from({ length: toLoad }).map((_, i) =>
            attached.loanApplications(i + 1),
            ),
        )
            .then((requests) => {
                if (canceled) return []

                return Promise.allSettled(
                    requests
                        .filter(
                            (request) =>
                                request.status === LoanApplicationStatus.APPLIED ||
                                request.status === LoanApplicationStatus.OFFER_DRAFTED ||
                                request.status === LoanApplicationStatus.OFFER_DRAFT_LOCKED ||
                                request.status === LoanApplicationStatus.OFFER_MADE,
                        )
                        .map((request) =>
                            Promise.all([
                                getBorrowerMetadata(request.borrower).then(
                                    (info) => (
                                        setBorrowerInfo(
                                            request.id.toNumber(),
                                            info,
                                        ),
                                            info
                                    )
                                ),
                                request.status !==
                                LoanApplicationStatus.APPLIED
                                    ? directQueryContract
                                          .loanOffers(request.id)
                                          .then((offer) => ({
                                              graceDefaultPeriod:
                                                  offer.gracePeriod.toNumber(),
                                              installmentAmount:
                                                  offer.installmentAmount,
                                              installments: offer.installments,
                                              interest: offer.apr,
                                              amount: offer.amount,
                                              duration: offer.duration,
                                              lockedTime: offer.lockedTime.toNumber()
                                          }))
                                    : undefined,
                            ]).then(
                                ([info, offer]: [
                                    {
                                        name: string
                                        businessName: string
                                        phone?: string
                                        email?: string
                                        isLocalCurrencyLoan?: boolean
                                        localDetail?: LocalDetail
                                    },
                                    OfferValues | undefined,
                                ]) =>
                                    ({
                                        ...info,
                                        ...request,
                                        ...offer,
                                        id: request.id.toNumber(),
                                    } as LoanRequest),
                            ),
                        ),
                )
            })
            .then((results) => {
                if (canceled) return

                setRequests(
                    results
                        .filter((result) => result.status === 'fulfilled')
                        .map(
                            (result) =>
                                (result as PromiseFulfilledResult<LoanRequest>)
                                    .value,
                        ),
                )
            })
            .catch((error) => {
                console.error(error)
            })

        return () => {
            canceled = true

            setRequests(null)
        }
    }, [block, loanDeskAddress, provider])

    const [offerModalRequest, setOfferModalRequest] =
        useState<LoanRequest | null>(null)

    return (
        <>
            <Box>
                <h2>Loan requests</h2>
                <div className={requests === null ? undefined : 'grid'}>
                    {requests ? (
                        requests.length ? (
                            mapLoanRequest(
                                requests.filter(
                                    (request) =>
                                        request.status ===
                                        LoanApplicationStatus.APPLIED,
                                ),
                                setOfferModalRequest,
                                liquidityTokenDecimals,
                            )
                        ) : (
                            'No loans awaiting approval'
                        )
                    ) : (
                        <div className="loading">
                            <Oval
                                speed={0.7}
                                stroke={rgbGreen}
                                width={32}
                                height={32}
                            />
                        </div>
                    )}
                </div>
            </Box>

            <Box>
                <h2>Draft offers</h2>
                <div className={requests === null ? undefined : 'grid'}>
                    {requests ? (
                        requests.length ? (
                            mapLoanRequest(
                                requests.filter(
                                    (request) =>
                                        request.status === LoanApplicationStatus.OFFER_DRAFTED,
                                ),
                                setOfferModalRequest,
                                liquidityTokenDecimals,
                            )
                        ) : (
                            'No active offers'
                        )
                    ) : (
                        <div className="loading">
                            <Oval
                                speed={0.7}
                                stroke={rgbGreen}
                                width={32}
                                height={32}
                            />
                        </div>
                    )}
                </div>
            </Box>

            <Box>
                <h2>Votable offers</h2>
                <div className={requests === null ? undefined : 'grid'}>
                    {requests ? (
                        requests.length ? (
                            mapLoanRequest(
                                requests.filter(
                                    (request) =>
                                        request.status ===
                                        LoanApplicationStatus.OFFER_DRAFT_LOCKED,
                                ),
                                setOfferModalRequest,
                                liquidityTokenDecimals,
                            )
                        ) : (
                            'No active offers'
                        )
                    ) : (
                        <div className="loading">
                            <Oval
                                speed={0.7}
                                stroke={rgbGreen}
                                width={32}
                                height={32}
                            />
                        </div>
                    )}
                </div>
            </Box>

            <Box>
                <h2>Active offers</h2>
                <div className={requests === null ? undefined : 'grid'}>
                    {requests ? (
                        requests.length ? (
                            mapLoanRequest(
                                requests.filter(
                                    (request) =>
                                        request.status ===
                                        LoanApplicationStatus.OFFER_MADE,
                                ),
                                setOfferModalRequest,
                                liquidityTokenDecimals,
                            )
                        ) : (
                            'No active offers'
                        )
                    ) : (
                        <div className="loading">
                            <Oval
                                speed={0.7}
                                stroke={rgbGreen}
                                width={32}
                                height={32}
                            />
                        </div>
                    )}
                </div>
            </Box>
            {offerModalRequest ? (
                <OfferModal
                    loan={offerModalRequest}
                    liquidityTokenDecimals={liquidityTokenDecimals}
                    borrowInfo={borrowInfo!}
                    poolAddress={poolAddress}
                    onClose={() => setOfferModalRequest(null)}
                    onDraftOffer={(
                        amount,
                        duration,
                        installmentAmount,
                        installments,
                        interest,
                        graceDefaultPeriod,
                        localDetail: LocalDetail,
                    ) => {
                        const contract = loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())

                        const isApplicationActive = offerModalRequest.status === LoanApplicationStatus.APPLIED

                        if (offerModalRequest) {
                            getBorrowerMetadata(offerModalRequest?.borrower).then(
                                (info) => {
                                    if (info) {
                                        setBorrowerInfo(offerModalRequest?.id, {...info, localDetail})
                                    }
                                }
                            )
                        }

                        return (
                            isApplicationActive
                                ? contract
                                    .draftOffer(
                                        offerModalRequest.id,
                                        amount,
                                        duration,
                                        graceDefaultPeriod,
                                        installmentAmount,
                                        installments,
                                        interest,
                                    )
                                    .then((tx) => ({
                                        tx,
                                        name: 'Update offer',
                                    }))
                                : contract
                                    .updateDraftOffer(
                                        offerModalRequest.id,
                                        amount,
                                        duration,
                                        graceDefaultPeriod,
                                        installmentAmount,
                                        installments,
                                        interest,
                                    )
                                    .then((tx) => ({
                                        tx,
                                        name: `Draft a loan offer for ${formatToken(
                                            amount,
                                            liquidityTokenDecimals,
                                        )} ${TOKEN_SYMBOL}`,
                                    }))
                            )
                            .then(({ tx, name }) =>
                                trackTransaction(dispatch, { name, tx }),
                            )
                            .then(() => {
                                setOfferModalRequest(null)
                                setRequests(
                                    requests!.map((loan) =>
                                        loan === offerModalRequest
                                            ? {
                                                  ...loan,
                                                  status: LoanApplicationStatus.OFFER_DRAFTED,
                                                  amount,
                                                  duration,
                                                  graceDefaultPeriod,
                                                  installmentAmount,
                                                  installments,
                                                  interest,
                                                  lockedTime: 0,
                                              }
                                            : loan,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }}
                    onReject={() => {
                        const contract = loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())

                        const isOfferActive =
                            offerModalRequest.status === LoanApplicationStatus.OFFER_DRAFTED ||
                            offerModalRequest.status === LoanApplicationStatus.OFFER_DRAFT_LOCKED ||
                            offerModalRequest.status === LoanApplicationStatus.OFFER_MADE;

                        return (
                            isOfferActive
                                ? contract
                                      .cancelLoan(offerModalRequest.id)
                                      .then((tx) => ({
                                          tx,
                                          name: 'Cancel loan',
                                          newStatus:
                                              LoanApplicationStatus.CANCELLED,
                                      }))
                                : contract
                                      .denyLoan(offerModalRequest.id)
                                      .then((tx) => ({
                                          tx,
                                          name: 'Reject loan',
                                          newStatus:
                                              LoanApplicationStatus.DENIED,
                                      }))
                        )
                            .then(({ tx, name, newStatus }) =>
                                trackTransaction(dispatch, { name, tx }).then(
                                    () => newStatus,
                                ),
                            )
                            .then((newStatus) => {
                                setOfferModalRequest(null)
                                setRequests(
                                    requests!.map((loan) =>
                                        loan === offerModalRequest
                                            ? {
                                                  ...loan,
                                                  status: newStatus as any,
                                              }
                                            : loan,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }}
                    onLock={() => {
                        const contract = loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())

                        return (
                            contract
                                    .lockDraftOffer(offerModalRequest.id)
                                    .then((tx) => ({
                                        tx,
                                        name: 'Lock draft offer',
                                        newStatus:
                                        LoanApplicationStatus.OFFER_DRAFT_LOCKED,
                                    }))

                        )
                            .then(({ tx, name, newStatus }) =>
                                trackTransaction(dispatch, { name, tx }).then(
                                    () => newStatus,
                                ),
                            )
                            .then((newStatus) => {
                                setOfferModalRequest(null)
                                setRequests(
                                    requests!.map((loan) =>
                                        loan === offerModalRequest
                                            ? {
                                                ...loan,
                                                status: newStatus as any,
                                            }
                                            : loan,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }}

                    onOffer={() => {
                        const contract = loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())

                        return (
                            contract
                                .offerLoan(offerModalRequest.id)
                                .then((tx) => ({
                                    tx,
                                    name: 'Activate Loan Offer',
                                    newStatus:
                                    LoanApplicationStatus.OFFER_MADE,
                                }))

                        )
                            .then(({ tx, name, newStatus }) =>
                                trackTransaction(dispatch, { name, tx }).then(
                                    () => newStatus,
                                ),
                            )
                            .then((newStatus) => {
                                setOfferModalRequest(null)
                                setRequests(
                                    requests!.map((loan) =>
                                        loan === offerModalRequest
                                            ? {
                                                ...loan,
                                                status: newStatus as any,
                                            }
                                            : loan,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }}
                />
            ) : null}

            <style jsx>{`
                h2 {
                    font-size: 16px;
                    margin-top: 0;
                }

                .loading {
                    > :global(svg) {
                        display: block;
                        margin: 10px auto 0;
                    }
                }

                .grid {
                    display: grid;
                    grid-template-columns: 30% 50% 20%;
                    > :global(.name) {
                        margin-right: 24px;
                        margin-bottom: 12px;
                        > :global(span) {
                            color: ${rgbGreen};
                            cursor: pointer;
                        }
                    }
                }
            `}</style>
        </>
    )
}

function mapLoanRequest(
    loans: LoanRequest[],
    setOfferModalRequest: (loan: LoanRequest) => void,
    liquidityTokenDecimals: number,
) {
    return loans.map((loan) => (
        <Fragment key={loan.id}>
            <div className="name">
                <span onClick={() => setOfferModalRequest(loan)}>
                    {loan.id}{'. '}{loan.name}
                </span>
            </div>
            <div className="description">
                <span>
                    {!loan.isLocalCurrencyLoan ? null :
                        <>
                            {Number(loan.localDetail.localLoanAmount).toFixed(2)}{' '}
                            {loan.localDetail.localCurrencyCode}{' '}
                            (
                        </>
                    }
                    {formatToken(loan.amount, liquidityTokenDecimals, 2)}{' '}
                    {TOKEN_SYMBOL}
                    {!loan.isLocalCurrencyLoan ? null :
                        <>)</>
                    }
                    {' '}for{' '}
                    {formatDurationInMonths(loan.duration.toNumber())} months
                </span>
            </div>
            <div>
                {' '}
            </div>
        </Fragment>
    ))
}

function OfferModal({
    loan,
    liquidityTokenDecimals,
    borrowInfo,
    poolAddress,
    onClose,
    onDraftOffer,
    onReject,
    onLock,
    onOffer,
}: {
    loan: LoanRequest
    liquidityTokenDecimals: number
    borrowInfo: BorrowInfo
    poolAddress: Address
    onClose(): void
    onDraftOffer(
        amount: BigNumber,
        duration: BigNumber,
        installmentAmount: BigNumber,
        installments: number,
        interest: number,
        graceDefaultPeriod: number,
        localDetail: LocalDetail,
    ): Promise<void | object>
    onReject(): Promise<void>
    onLock(): Promise<void>
    onOffer(): Promise<void>
}) {
    const [poolLiquidity] = usePoolLiquidity(poolAddress)

    const isOfferDrafted = loan.status === LoanApplicationStatus.OFFER_DRAFTED
    const isOfferDraftLocked = loan.status === LoanApplicationStatus.OFFER_DRAFT_LOCKED
    const isOfferMade = loan.status === LoanApplicationStatus.OFFER_MADE
    const isDraftedOrActive =
        loan.status === LoanApplicationStatus.OFFER_DRAFTED ||
        loan.status === LoanApplicationStatus.OFFER_DRAFT_LOCKED ||
        loan.status === LoanApplicationStatus.OFFER_MADE

    const isEditable = !isOfferDraftLocked && !isOfferMade

    const {
        initialAmount,
        initialMonths,
        initialInstallments,
        initialInstallmentAmount,
        initialInterestValue,
        initialGraceDefaultPeriod,
    } = useMemo(() => {
        const initialAmount = formatInputAmount(
            loan.amount,
            liquidityTokenDecimals,
        )
        const duration = loan.duration.toNumber()
        const initialMonthsNumber = formatDurationInMonths(duration)
        const initialMonths = initialMonthsNumber.toString() as InputAmount

        if (isDraftedOrActive) {
            return {
                initialAmount,
                initialMonths,
                initialInstallments:
                    loan.installments.toString() as InputAmount,
                initialInstallmentAmount: formatInputAmount(
                    loan.installmentAmount,
                    liquidityTokenDecimals,
                ),
                initialInterestValue: (
                    loan.interest / 10
                ).toString() as InputAmount,
                initialGraceDefaultPeriod: (
                    loan.graceDefaultPeriod / oneDay
                ).toString() as InputAmount,
            }
        }

        const initialInstallments = Math.max(Math.ceil(initialMonthsNumber), 1)

        return {
            initialAmount,
            initialMonths,
            initialInstallments: initialInstallments.toString() as InputAmount,
            initialInstallmentAmount: formatInputAmount(
                getInstallmentAmount(
                    loan.amount,
                    borrowInfo.apr,
                    initialInstallments,
                    duration,
                ),
                liquidityTokenDecimals,
            ),
            initialInterestValue: borrowInfo.apr.toString() as InputAmount,
            initialGraceDefaultPeriod: '35' as InputAmount,
        }
    }, [isDraftedOrActive, liquidityTokenDecimals, loan, borrowInfo])
    const [amount, setAmount] = useState<InputAmount>(initialAmount)

    const [amountLocal, setAmountLocal] = useState<InputAmount>(
        loan.isLocalCurrencyLoan
            ? Number(loan.localDetail.localLoanAmount).toFixed(2) as InputAmount
            : "0" as InputAmount
    )

    const [fxRate, setFxRate] = useState<InputAmount>(
        loan.isLocalCurrencyLoan
            ? loan.localDetail.fxRate?.toFixed(2) as InputAmount
            : "0" as InputAmount
    )

    const updateAmountLocal = (input:InputAmount) => {
        setAmountLocal(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        let amountNum = inputNum / Number(fxRate)
        setAmount(formatNumberInputAmount(Number.parseFloat(amountNum.toFixed(2))) as InputAmount)
    }

    const updateAmount = (input:InputAmount) => {
        setAmount(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        let newFxRate = inputNum > 0 ? formatNumberInputAmount(Number.parseFloat((Number(amountLocal) / inputNum).toFixed(2))) : 0
        setFxRate(newFxRate as InputAmount)
    }

    const updateFxRate = (input:InputAmount) => {
        setFxRate(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        let newAmount = inputNum > 0 ? formatNumberInputAmount(Number.parseFloat((Number(amountLocal) / inputNum).toFixed(2))) : 0
        setAmount(newAmount as InputAmount)

        let newInstallmentAmount = inputNum > 0 ? formatNumberInputAmount(Number.parseFloat((Number(localInstallmentAmount) / inputNum).toFixed(2))) : 0
        setInstallmentAmount(newInstallmentAmount as InputAmount)
    }

    const updateLocalInstallmentAmount = (input:InputAmount) => {
        setLocalInstallmentAmount(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        let installmentAmountNum = inputNum / Number(fxRate)
        setInstallmentAmount(formatNumberInputAmount(Number.parseFloat(installmentAmountNum.toFixed(6))) as InputAmount)
    }

    const updateInstallmentAmount = (input:InputAmount) => {
        setInstallmentAmount(input)

        let inputNum = input && input.trim().length >= 1 ? Number(input) : 0
        let localInstallmentAmountNum = inputNum * Number(fxRate)
        setLocalInstallmentAmount(formatNumberInputAmount(Number.parseFloat(localInstallmentAmountNum.toFixed(2))) as InputAmount)
    }

    const [duration, setDuration] = useState<InputAmount>(initialMonths)
    const [installments, setInstallments] =
        useState<InputAmount>(initialInstallments)
    const [installmentAmount, setInstallmentAmount] = useState<InputAmount>(
        initialInstallmentAmount,
    )
    const [localInstallmentAmount, setLocalInstallmentAmount] = useState<InputAmount>(
        !loan.isLocalCurrencyLoan ? initialInstallmentAmount :
            formatNumberInputAmount(Number.parseFloat((Number(initialInstallmentAmount) * Number(loan.localDetail.fxRate)).toFixed(2))) as InputAmount,
    )
    const [interest, setInterest] = useState<InputAmount>(initialInterestValue)
    const [graceDefaultPeriod, setGraceDefaultPeriod] = useState<InputAmount>(
        initialGraceDefaultPeriod,
    )

    const [isDraftOfferLoading, setIsDraftOfferLoading] = useState(false)
    const [isRejectLoading, setIsRejectLoading] = useState(false)
    const [isLockLoading, setIsLockLoading] = useState(false)
    const [isMakeActiveLoading, setIsMakeActiveLoading] = useState(false)

    const [interestOnly, setInterestOnly] = useState(false)
    const [amortized, setAmortized] = useState(!isDraftedOrActive)

    const [previousInstallmentAmount, setPreviousInstallmentAmount] = useState(
        '' as InputAmount,
    )
    const installmentAmountValue = useMemo(
        () =>
            interestOnly
                ? calculateInterestOnly(
                      parseUnits(amount, liquidityTokenDecimals),
                      Number(interest),
                      Number(duration) * thirtyDays,
                      parseInt(installments, 10),
                      liquidityTokenDecimals,
                  )
                : amortized ? formatInputAmount(
                    getInstallmentAmount(
                        parseUnits(amount.length > 0 ? amount : "0", liquidityTokenDecimals),
                        Number(interest.length > 0 && Number(interest) > 0 ? interest : "1"),
                        Math.max(parseInt(installments.length > 0 ? installments : initialInstallments, 10), 1),
                        Number(duration.length > 0 ? duration : loan.duration.toNumber()) * thirtyDays,
                    ),
                    liquidityTokenDecimals,
                ) : installmentAmount,
        [
            interestOnly,
            amortized,
            amount,
            liquidityTokenDecimals,
            interest,
            duration,
            installments,
            installmentAmount,
        ],
    )

    const localInstallmentAmountValue = useMemo(
        () =>
            interestOnly || amortized
                ? formatNumberInputAmount(Number.parseFloat((Number(installmentAmountValue) * Number(fxRate)).toFixed(2))) as InputAmount
                : localInstallmentAmount,
        [
            interestOnly,
            amortized,
            installmentAmountValue,
            localInstallmentAmount
        ],
    )

    const [amountBigNumber, monthly, scheduleArg] = useMemo<
        [BigNumber, boolean, Parameters<typeof useSimpleSchedule>[0]]
    >(() => {
        const now = Math.trunc(Date.now() / 1000)

        if (
            !amount ||
            !amountLocal ||
            !fxRate ||
            !duration ||
            !interest ||
            !installments ||
            !installmentAmountValue
        ) {
            return [zero, false, null]
        }

        const amountBigNumber = parseUnits(amount, liquidityTokenDecimals)

        const durationNumber = Number(duration)
        const installmentsNumber = parseInt(installments, 10)

        return [
            amountBigNumber,
            durationNumber % 1 === 0 && installmentsNumber === durationNumber,
            {
                amount: amountBigNumber,
                duration: Number(duration) * thirtyDays,
                apr: Number(interest),
                borrowedTime: now,
                installments: installmentsNumber,
                installmentAmount: parseUnits(
                    installmentAmountValue,
                    liquidityTokenDecimals,
                ),
                details: {
                    baseAmountRepaid: zeroHex,
                    totalAmountRepaid: zeroHex,
                    interestPaid: zeroHex,
                    interestPaidUntil: now,
                },
            },
        ]
    }, [
        amount,
        amountLocal,
        fxRate,
        liquidityTokenDecimals,
        duration,
        interest,
        installments,
        installmentAmountValue,
    ])
    const schedule = useSimpleSchedule(
        scheduleArg,
        BigNumber.from((Number(localInstallmentAmountValue) * 1000000).toFixed(0)),
        Number(fxRate)
    )

    const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (event) => {
            event.preventDefault()
            setIsDraftOfferLoading(true)
            onDraftOffer(
                parseUnits(amount, liquidityTokenDecimals),
                BigNumber.from(Number(duration) * thirtyDays),
                parseUnits(installmentAmountValue, liquidityTokenDecimals),
                parseInt(installments, 10),
                Number(interest) * 10,
                Number(graceDefaultPeriod) * oneDay,
                {
                    localLoanAmount: amountLocal.toString(),
                    localCurrencyCode: loan.localDetail?.localCurrencyCode,
                    fxRate: Number(fxRate),
                    localInstallmentAmount: localInstallmentAmountValue,
                },
            ).catch(() => {
                setIsDraftOfferLoading(false)
            })
        },
        [
            amount,
            amountLocal,
            fxRate,
            duration,
            graceDefaultPeriod,
            installmentAmountValue,
            installments,
            interest,
            liquidityTokenDecimals,
            onDraftOffer,
        ],
    )

    const handleReject = useCallback(() => {
        setIsRejectLoading(true)
        onReject().catch(() => {
            setIsRejectLoading(false)
        })
    }, [onReject])

    const handleLock = useCallback(() => {
        setIsLockLoading(true)
        onLock().catch(() => {
            setIsLockLoading(false)
        })
    }, [onLock])

    const handleMakeActive = useCallback(() => {
        setIsMakeActiveLoading(true)
        onOffer().catch(() => {
            setIsMakeActiveLoading(false)
        })
    }, [onOffer])

    const amountInvalidMessage = useMemo(
        () => {

            let isGteMin = checkAmountValidity(
                amount,
                liquidityTokenDecimals,
                borrowInfo.minLoanAmount,
            )

            let isLteMax = poolLiquidity
                ? checkAmountMaxValidity(
                    amount,
                    liquidityTokenDecimals,
                    isDraftedOrActive
                        ? BigNumber.from(poolLiquidity).add(parseUnits(initialAmount, liquidityTokenDecimals))
                        : poolLiquidity,
                )
                : true

            return !isGteMin
                ? `Minimum amount is ${formatToken(
                    BigNumber.from(borrowInfo.minLoanAmount),
                    liquidityTokenDecimals,
                    2,
                    true
                )}`
                : !isLteMax
                    ? `Maximum available amount is ${formatToken(
                        isDraftedOrActive 
                            ? BigNumber.from(poolLiquidity).add(parseUnits(initialAmount, liquidityTokenDecimals))
                            : BigNumber.from(poolLiquidity),
                        liquidityTokenDecimals,
                        2,
                        false
                    )}`
                    : ''
        },
        [amount, borrowInfo.minLoanAmount, poolLiquidity, liquidityTokenDecimals],
    )

    const isAmountLocalInvalid = useMemo(
        () =>
            !checkAmountValidity(
                amountLocal,
                liquidityTokenDecimals,
                BigNumber.from(borrowInfo.minLoanAmount)
                    .mul((Number(fxRate) * 100).toFixed(0))
                    .div(100),
            ),
        [amountLocal, borrowInfo.minLoanAmount, liquidityTokenDecimals],
    )

    const durationInvalidMessage = useMemo(() => {
        const inSeconds = Number(duration) * thirtyDays

        return inSeconds < borrowInfo.minLoanDuration
            ? `Minimum duration is ${borrowInfo.minLoanDuration / oneDay} day`
            : inSeconds > borrowInfo.maxLoanDuration
            ? `Maximum duration is ${
                  borrowInfo.maxLoanDuration / oneYear
              } years`
            : ''
    }, [duration, borrowInfo.minLoanDuration, borrowInfo.maxLoanDuration])
    const isInstallmentAmountInvalid = useMemo(
        () =>
            !checkAmountValidity(
                installmentAmountValue,
                liquidityTokenDecimals,
                zero,
            ),
        [installmentAmountValue, liquidityTokenDecimals],
    )

    // const isLocalInstallmentAmountInvalid = useMemo(
    //     () =>
    //         !checkAmountValidity(
    //             localInstallmentAmountValue,
    //             2,
    //             zero,
    //         ),
    //     [localInstallmentAmountValue],
    // )
    const isInterestInvalid = useMemo(() => {
        return Number(interest) <= 0
    }, [interest])
    const installmentsInvalidMessage = useMemo(() => {
        const installmentsNumber = parseInt(installments, 10)
        return installmentsNumber < 1
            ? 'Installments must be at least 1'
            : installmentsNumber > (Number(duration) * thirtyDays) / oneDay
            ? 'Installments can not be more than the duration in days'
            : ''
    }, [duration, installments])
    const graceDefaultPeriodInvalidMessage = useMemo(() => {
        const graceDefaultPeriodNumber = Number(graceDefaultPeriod)
        return graceDefaultPeriodNumber < 3
            ? 'Grace default period must be at least 3'
            : graceDefaultPeriodNumber > 365
            ? 'Grace default period must be less than 365'
            : ''
    }, [graceDefaultPeriod])

    const localDetail = useMemo(
        () => {
            return {
                localLoanAmount: amountLocal,
                localCurrencyCode: loan.localDetail?.localCurrencyCode,
                fxRate: Number(fxRate),
            }
        },
        [amountLocal, fxRate, localInstallmentAmount],
    )

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <h3>{isOfferMade ? 'Active Loan Offer' : 'Draft Loan Offer'}</h3>

                <div className="field">
                    <div className="label">Account</div>
                    <div>
                        <EtherscanAddress address={loan.borrower} />
                    </div>
                </div>
                <div className="field">
                    <div className="label">Name</div>
                    <div>{loan.name}</div>
                </div>
                <div className="field">
                    <div className="label">Business Name</div>
                    <div>{loan.businessName}</div>
                </div>
                {loan.phone ? (
                    <div className="field">
                        <div className="label">Phone</div>
                        <div>
                            <a href={`tel:${loan.phone}`}>{loan.phone}</a>
                        </div>
                    </div>
                ) : null}
                {loan.email ? (
                    <div className="field">
                        <div className="label">Email</div>
                        <div>
                            <a href={`mailto:${loan.email}`}>{loan.email}</a>
                        </div>
                    </div>
                ) : null}
                {/*
                {!loan.email && !loan.phone ? (
                    <Button
                        type="button"
                        stone
                        onClick={onFetchBorrowerInfo}
                        style={{ marginTop: 16 }}
                    >
                        Get contact information
                    </Button> // TODO: If auth is valid fetch automatically
                ) : null}
                */}
                {!loan.isLocalCurrencyLoan ? null :
                    <label>
                        <div className="label">Amount in Local Currency</div>
                        <AmountInput
                            invalid
                            decimals={2}
                            value={amountLocal}
                            onChange={updateAmountLocal}
                            disabled={isDraftOfferLoading || !isEditable}
                            currency={loan.localDetail.localCurrencyCode}
                        />
                        {isAmountLocalInvalid ? (
                            <Alert
                                style="error"
                                title={`Minimum amount is ${formatToken(
                                    BigNumber.from(borrowInfo.minLoanAmount).mul((Number(fxRate) * 100).toFixed(0)).div(100),
                                    liquidityTokenDecimals,
                                )}`}
                            />
                        ) : null}
                    </label>
                }
                <label>
                    <div className="label">Amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={amount}
                        onChange={updateAmount}
                        disabled={isDraftOfferLoading || !isEditable}
                        invalid={Boolean(amountInvalidMessage)}
                    />
                    {amountInvalidMessage ? (
                        <Alert style="error" title={amountInvalidMessage} />
                    ) : null}
                </label>
                {!loan.isLocalCurrencyLoan ? null :
                    <label>
                        <div className="label">FX Rate, 1 USDT =</div>
                        <AmountInput
                            invalid
                            decimals={2}
                            value={fxRate}
                            onChange={updateFxRate}
                            disabled={isDraftOfferLoading || !isEditable}
                            currency={loan.localDetail.localCurrencyCode}
                        />
                    </label>
                }
                <label>
                    <div className="label">Duration</div>
                    <AmountInput
                        decimals={100}
                        value={duration}
                        onChange={setDuration}
                        disabled={isDraftOfferLoading || !isEditable}
                        invalid={Boolean(durationInvalidMessage)}
                        noToken
                        label="months"
                        paddingRight={60}
                    />
                    {durationInvalidMessage ? (
                        <Alert style="error" title={durationInvalidMessage} />
                    ) : null}
                </label>
                <label>
                    <div className="label">Installments</div>
                    <AmountInput
                        decimals={0}
                        value={installments}
                        onChange={setInstallments}
                        disabled={isDraftOfferLoading || !isEditable}
                        invalid={Boolean(installmentsInvalidMessage)}
                        noToken
                    />
                    {installmentsInvalidMessage ? (
                        <Alert
                            style="error"
                            title={installmentsInvalidMessage}
                        />
                    ) : null}
                </label>
                <label>
                    <div className="label">Interest p/a</div>
                    <AmountInput
                        decimals={1}
                        value={interest}
                        onChange={setInterest}
                        disabled={isDraftOfferLoading || !isEditable}
                        invalid={isInterestInvalid}
                        noToken
                        label="%"
                        paddingRight={26}
                    />
                    {isInterestInvalid ? (
                        <Alert style="error" title="Invalid interest" />
                    ) : null}
                </label>
                {/*
                <label>
                    <div className="label">Local Installment Amount</div>
                    <AmountInput
                        decimals={2}
                        value={localInstallmentAmountValue}
                        onChange={updateLocalInstallmentAmount}
                        disabled={!isEditable || isOfferLoading || interestOnly || amortized}
                        invalid={isLocalInstallmentAmountInvalid}
                        currency={loan.localDetail?.localCurrencyCode}
                    />
                    {isLocalInstallmentAmountInvalid ? (
                        <Alert
                            style="error"
                            title="Invalid installment amount"
                        />
                    ) : null}
                </label>
                */}
                <label>
                    <div className="label">Installment Amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={installmentAmountValue}
                        onChange={updateInstallmentAmount}
                        disabled={!isEditable || isDraftOfferLoading || interestOnly || amortized}
                        invalid={isInstallmentAmountInvalid}
                    />
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={interestOnly}
                            disabled={isDraftOfferLoading || !isEditable}
                            onChange={() => {
                                if (interestOnly) {
                                    setInstallmentAmount(
                                        previousInstallmentAmount,
                                    )
                                    setInterestOnly(false)
                                } else {
                                    setPreviousInstallmentAmount(
                                        installmentAmount,
                                    )
                                    setInterestOnly(true)
                                }
                            }}
                        />
                        Interest only
                    </label>
                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={amortized}
                            disabled={isDraftOfferLoading || !isEditable}
                            onChange={() => {
                                if (amortized) {
                                    setAmortized(false)
                                } else {
                                    setAmortized(true)
                                }
                            }}
                        />
                        Amortized
                    </label>
                    {isInstallmentAmountInvalid ? (
                        <Alert
                            style="error"
                            title="Invalid installment amount"
                        />
                    ) : null}
                </label>
                <label>
                    <div className="label">Grace Default Period</div>
                    <AmountInput
                        decimals={2}
                        value={graceDefaultPeriod}
                        onChange={setGraceDefaultPeriod}
                        disabled={isDraftOfferLoading || !isEditable}
                        invalid={Boolean(graceDefaultPeriodInvalidMessage)}
                        noToken
                        label="days"
                        paddingRight={44}
                    />
                    {graceDefaultPeriodInvalidMessage ? (
                        <Alert
                            style="error"
                            title={graceDefaultPeriodInvalidMessage}
                        />
                    ) : null}
                </label>

                <div className="schedule-container">
                    <ScheduleSummary
                        amount={amountBigNumber}
                        monthly={monthly}
                        schedule={schedule}
                        liquidityTokenDecimals={liquidityTokenDecimals}
                        isLocalCurrencyLoan={loan.isLocalCurrencyLoan ?? false}
                        localDetail={localDetail}
                    />
                </div>

                <div className="buttons">
                    { !isEditable ? null :
                        <Button
                            disabled={Boolean(
                                isDraftOfferLoading ||
                                    isRejectLoading ||
                                    isLockLoading ||
                                    isMakeActiveLoading ||
                                    amountInvalidMessage ||
                                    durationInvalidMessage ||
                                    installmentsInvalidMessage ||
                                    isInterestInvalid ||
                                    isInstallmentAmountInvalid ||
                                    graceDefaultPeriodInvalidMessage,
                            )}
                            loading={isDraftOfferLoading}
                            type="submit"
                        >
                            {isOfferDrafted ? 'Update Draft Offer' : 'Draft Offer'}
                        </Button>
                    }
                    { !isOfferDrafted ? null :
                        <Button
                            disabled={Boolean(
                                isDraftOfferLoading ||
                                isRejectLoading ||
                                isLockLoading ||
                                isMakeActiveLoading ||
                                amountInvalidMessage ||
                                durationInvalidMessage ||
                                installmentsInvalidMessage ||
                                isInterestInvalid ||
                                isInstallmentAmountInvalid ||
                                graceDefaultPeriodInvalidMessage,
                            )}
                            loading={isLockLoading}
                            onClick={handleLock}
                            type="button"
                        >
                            {'Lock for Voting'}
                        </Button>
                    }
                    { !isOfferDraftLocked ? null :
                        <Button
                            disabled={Boolean(
                                isDraftOfferLoading ||
                                isRejectLoading ||
                                isLockLoading ||
                                isMakeActiveLoading ||
                                amountInvalidMessage ||
                                durationInvalidMessage ||
                                installmentsInvalidMessage ||
                                isInterestInvalid ||
                                isInstallmentAmountInvalid ||
                                graceDefaultPeriodInvalidMessage ||
                                Math.ceil((loan.lockedTime+48*60*60 - Date.now()/1000)/60/60) > 0
                            )}
                            loading={isMakeActiveLoading}
                            onClick={handleMakeActive}
                            type="button"
                        >
                            {'Make Active'}
                            {Math.ceil((loan.lockedTime+48*60*60 - Date.now()/1000)/60/60) > 0
                                ? ' - Locked for ' + Math.ceil((loan.lockedTime+48*60*60 - Date.now()/1000)/60/60) + 'H'
                                : null}
                        </Button>
                    }
                    <Button
                        disabled={isDraftOfferLoading || isRejectLoading || isLockLoading || isMakeActiveLoading}
                        loading={isRejectLoading}
                        onClick={handleReject}
                        type="button"
                        stone
                    >
                        {isDraftedOrActive ? 'Cancel' : 'Reject Application'}
                    </Button>
                </div>

                <style jsx>{`
                    form {
                        padding: 20px;

                        > h3 {
                            margin-top: 0;
                        }

                        > .field,
                        > label {
                            display: block;
                            margin-top: 16px;

                            > .label {
                                color: var(--color-secondary);
                                font-weight: 400;
                                margin-bottom: 8px;
                            }

                            > .checkbox {
                                display: flex;
                                align-items: center;

                                > input[type='checkbox'] {
                                    width: 16px;
                                    height: 16px;
                                    margin-right: 4px;
                                }
                            }

                            > :global(.alert) {
                                margin-top: 8px;
                            }
                        }

                        > .buttons {
                            display: flex;

                            > :global(button) {
                                margin: 16px 8px 0 0;
                            }
                        }

                        > .schedule-container {
                            color: ${rgbYellowDarker};
                            background-color: ${rgbYellowLighter};
                            margin-top: 16px;
                            padding: 12px 16px;
                            border-radius: 8px;
                        }
                    }
                `}</style>
            </form>
        </Modal>
    )
}

function calculateInterestOnly(
    amount: BigNumber,
    interest: number,
    duration: number,
    installments: number,
    liquidityTokenDecimals: number,
) {
    const now = Math.trunc(Date.now() / 1000)
    return formatInputAmount(
        amountWithInterest(
            amount,
            zero,
            now,
            interest,
            now + duration / installments,
        ).interestOutstanding,
        liquidityTokenDecimals,
    )
}
