import 'isomorphic-fetch'

import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import {
    FormEventHandler,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    APP_NAME,
    BORROWER_SERVICE_URL,
    format,
    getAddress,
    POOLS,
    prefix,
    shortenAddress,
    TOKEN_SYMBOL,
    useAccount,
    useProvider,
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
    LoanStatus,
    Pool,
    useLoans,
    useBorrowInfo,
    loanRequestedSignature,
    trackTransaction,
    loanDeskContract,
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

            <BackToPools href="/borrow" />
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
const thirtyDays = oneDay * 30
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
                isAmountValid: true,
                invalidAmountMessage: '',
                isDurationValid: true,
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
                    'A loan you requested is already pending approval'
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
