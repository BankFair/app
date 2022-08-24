import { BigNumber } from '@ethersproject/bignumber'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import {
    FormEventHandler,
    Fragment,
    useCallback,
    useEffect,
    useMemo,
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
    Tabs,
    useAmountForm,
} from '../../components'
import {
    getBatchProviderAndLoanDeskContract,
    LoanApplicationStatus,
    loanDeskContract,
    Pool,
    refetchStatsIfUsed,
    trackTransaction,
    useManagerInfo,
    useStatsState,
} from '../../features'
import { useDispatch, useSelector } from '../../store'
import { Oval } from 'react-loading-icons'

const title = `Earn - ${APP_NAME}`

const Manage: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const account = useAccount()

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

            <BackToPools href="/manage" />
            <h1>{pool.name}</h1>
            {pool ? (
                pool.managerAddress === account ? (
                    <>
                        <StakeAndUnstake pool={pool} poolAddress={address} />
                        <LoansAwaitingApproval pool={pool} />
                        <Loans pool={pool} poolAddress={address} />
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

const types = ['Stake', 'Unstake'] as const
function StakeAndUnstake({
    pool: { managerAddress, liquidityTokenAddress, liquidityTokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [type, setType] = useState<typeof types[number]>('Stake')

    const account = useAccount()

    const [stats] = useStatsState(poolAddress)
    const [info, refetchManagerInfo] = useManagerInfo(poolAddress)

    const max = useMemo(() => {
        if (type === 'Stake') return undefined

        if (info) return BigNumber.from(info.unstakable)

        return undefined
    }, [type, info])

    const isNotManager = managerAddress !== account

    const { form, value } = useAmountForm({
        type,
        onSumbit:
            type === 'Stake'
                ? (contract, amount) =>
                      contract.stake(parseUnits(amount, liquidityTokenDecimals))
                : (contract, amount) =>
                      contract.unstake(
                          parseUnits(amount, liquidityTokenDecimals),
                      ),
        refetch: () =>
            Promise.all([
                refetchManagerInfo(),
                refetchStatsIfUsed(poolAddress),
            ]),
        poolAddress,
        liquidityTokenAddress,
        liquidityTokenDecimals,
        disabled: Boolean(isNotManager),
        max,
    })

    return (
        <Box
            loading={Boolean(type === 'Unstake' && account ? !info : false)}
            overlay={isNotManager ? 'Only manager can stake' : undefined}
        >
            <Tabs tabs={types} currentTab={type} setCurrentTab={setType}></Tabs>

            {form}

            {type === 'Stake' ? (
                <Alert
                    style="warning-filled"
                    title="You should not stake unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges"
                />
            ) : (
                <ExitAlert
                    value={value}
                    verb="unstaking"
                    feePercent={stats ? stats.exitFeePercent : 0}
                />
            )}
        </Box>
    )
}

interface LoanRequest {
    id: string
    borrower: string
    amount: BigNumber
    duration: BigNumber
    name: string
    businessName: string
    phone?: string
    email?: string
}
function LoansAwaitingApproval({
    pool: { loanDeskAddress, liquidityTokenDecimals, block },
}: {
    pool: Pool
}) {
    const dispatch = useDispatch()
    const provider = useProvider()
    const [requests, setRequests] = useState<LoanRequest[] | null>(null)
    useEffect(() => {
        let canceled = false

        const contract = loanDeskContract
            .attach(loanDeskAddress)
            .connect(provider!)

        contract
            .queryFilter(contract.filters.LoanRequested(), block)
            .then((events) => {
                console.log(events)
                if (canceled) return []

                const { contract: attached } =
                    getBatchProviderAndLoanDeskContract(events.length, contract)

                return Promise.all(
                    events.map(({ data }) => attached.loanApplications(data)),
                )
            })
            .then((requests) => {
                if (canceled) return []

                return Promise.allSettled(
                    requests
                        .filter(
                            (request) =>
                                request.status ===
                                LoanApplicationStatus.APPLIED,
                        )
                        .map((request) =>
                            fetch(
                                `${BORROWER_SERVICE_URL}/profile/${request.profileId}`,
                            )
                                .then((response) => response.json())
                                .then(
                                    (info: {
                                        name: string
                                        businessName: string
                                        phone?: string
                                        email?: string
                                    }) =>
                                        ({
                                            ...info,
                                            ...request,
                                            id: request.id.toHexString(),
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

    const [offerForRequest, setOfferForRequest] = useState<LoanRequest | null>(
        null,
    )

    return (
        <Box>
            <h2>Loans awaiting approval</h2>
            <div className={requests === null ? undefined : 'grid'}>
                {requests ? (
                    requests.map((loan) => (
                        <Fragment key={loan.id}>
                            <div className="name">
                                <span onClick={() => setOfferForRequest(loan)}>
                                    {loan.name}
                                </span>
                            </div>
                            <div className="description">
                                <span>
                                    {formatUnits(
                                        loan.amount,
                                        liquidityTokenDecimals,
                                    )}{' '}
                                    {TOKEN_SYMBOL} for{' '}
                                    {formatDurationInMonths(
                                        loan.duration.toNumber(),
                                    )}{' '}
                                    months
                                </span>
                            </div>
                            <div className="address">
                                <EtherscanAddress address={loan.borrower} />
                            </div>
                        </Fragment>
                    ))
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

            {offerForRequest ? (
                <OfferModal
                    loan={offerForRequest}
                    liquidityTokenDecimals={liquidityTokenDecimals}
                    onClose={() => setOfferForRequest(null)}
                    onOffer={(
                        amount,
                        duration,
                        installmentAmount,
                        installments,
                        interest,
                        graceDefaultPeriod,
                    ) =>
                        loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())
                            .offerLoan(
                                offerForRequest.id,
                                amount,
                                duration,
                                graceDefaultPeriod,
                                installmentAmount,
                                installments,
                                interest,
                            )
                            .then((tx) =>
                                trackTransaction(dispatch, {
                                    name: `Offer a loan for ${formatUnits(
                                        amount,
                                        liquidityTokenDecimals,
                                    )} ${TOKEN_SYMBOL}`,
                                    tx,
                                }),
                            )
                            .then(() => {
                                setOfferForRequest(null)
                                setRequests(
                                    requests!.filter(
                                        (loan) => loan !== offerForRequest,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }
                    onReject={() =>
                        loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())
                            .denyLoan(offerForRequest.id)
                            .then((tx) =>
                                trackTransaction(dispatch, {
                                    name: `Reject loan`,
                                    tx,
                                }),
                            )
                            .then(() => {
                                setOfferForRequest(null)
                                setRequests(
                                    requests!.filter(
                                        (loan) => loan !== offerForRequest,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }
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
                    > .name {
                        > span {
                            color: ${rgbGreen};
                            cursor: pointer;
                        }
                    }
                }
            `}</style>
        </Box>
    )
}

function OfferModal({
    loan,
    onClose,
    liquidityTokenDecimals,
    onOffer,
    onReject,
}: {
    loan: LoanRequest
    liquidityTokenDecimals: number
    onClose(): void
    onOffer(
        amount: BigNumber,
        duration: BigNumber,
        installmentAmount: BigNumber,
        installments: number,
        interest: number,
        graceDefaultPeriod: number,
    ): Promise<void | object>
    onReject(): Promise<void>
}) {
    const [amount, setAmount] = useState(
        formatUnits(loan.amount, liquidityTokenDecimals),
    )
    const { initialMonths, initialInstallmentAmount } = useMemo(() => {
        const initialMonths = formatDurationInMonths(loan.duration.toNumber())

        return {
            initialMonths: initialMonths.toString(),
            initialInstallmentAmount: formatUnits(
                loan.amount.mul(100).div(initialMonths).div(100),
                liquidityTokenDecimals,
            ),
        }
    }, [liquidityTokenDecimals, loan.amount, loan.duration])
    const [duration, setDuration] = useState(initialMonths)
    const [installmentAmount, setInstallmentAmount] = useState(
        initialInstallmentAmount,
    )
    const [interest, setInterest] = useState('35')
    const [graceDefaultPeriod, setGraceDefaultPeriod] = useState('35')

    const [isOfferLoading, setIsOfferLoading] = useState(false)
    const [isRejectLoading, setIsRejectLoading] = useState(false)

    const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (event) => {
            event.preventDefault()
            setIsOfferLoading(true)
            onOffer(
                parseUnits(amount, liquidityTokenDecimals),
                BigNumber.from(Number(duration) * thirtyDays),
                parseUnits(installmentAmount, liquidityTokenDecimals),
                parseInt(duration, 10),
                Number(interest) * 10,
                Number(graceDefaultPeriod) * oneDay,
            ).catch(() => {
                setIsOfferLoading(false)
            })
        },
        [
            amount,
            duration,
            graceDefaultPeriod,
            installmentAmount,
            interest,
            liquidityTokenDecimals,
            onOffer,
        ],
    )

    const handleReject = useCallback(() => {
        setIsRejectLoading(true)
        onReject().catch(() => {
            setIsRejectLoading(false)
        })
    }, [onReject])

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <h3>Offer a Loan</h3>

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
                <label>
                    <div className="label">Amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={amount}
                        onChange={setAmount}
                        // disabled={disabled}
                        // onBlur={() =>
                        //     !checkAmountValidity(
                        //         amount,
                        //         liquidityTokenDecimals,
                        //         borrowInfo!.minLoanAmount,
                        //     ) && setDisplayAlert(true)
                        // }
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? !checkAmountValidity(
                        //               amount,
                        //               liquidityTokenDecimals,
                        //               borrowInfo!.minLoanAmount,
                        //           ) && setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Duration</div>
                    <AmountInput
                        decimals={0}
                        value={duration}
                        onChange={setDuration}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        label="months"
                        paddingRight={60}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Interest p/a</div>
                    <AmountInput
                        decimals={1}
                        value={interest}
                        onChange={setInterest}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        label="%"
                        paddingRight={26}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Installment amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={installmentAmount}
                        onChange={setInstallmentAmount}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Grace Default Period</div>
                    <AmountInput
                        decimals={2}
                        value={graceDefaultPeriod}
                        onChange={setGraceDefaultPeriod}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        label="days"
                        paddingRight={44}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>

                {/* {displayAlert && alert ? (
            <div className="alert-positioner">
                <Alert style="error-filled" title={alert} />
            </div>
        ) : null} */}

                <div className="buttons">
                    <Button
                        disabled={isOfferLoading}
                        loading={isOfferLoading}
                        type="submit"
                    >
                        Offer Loan
                    </Button>
                    <Button
                        disabled={isRejectLoading}
                        loading={isRejectLoading}
                        onClick={handleReject}
                        type="button"
                        stone
                    >
                        Reject Application
                    </Button>
                </div>
                {/* Disabled elements prevent any click events to be fired resulting in inputs not being blurred */}
                {/* {account && disabledSubmit ? (
                        <div className="clickable" onClick={showDisplayAlert} />
                    ) : null} */}

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
                        }

                        > .buttons {
                            display: flex;

                            > :global(button) {
                                margin: 16px 8px 0 0;
                            }
                        }
                    }
                `}</style>
            </form>
        </Modal>
    )
}
