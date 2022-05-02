import { parseUnits, formatUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import TimeAgo from 'timeago-react'
import {
    APP_NAME,
    CONTRACT_ADDRESS,
    timeout,
    TOKEN_SYMBOL,
    useAccount,
    useProvider,
} from '../app'
import { Button, EtherscanLink, Page } from '../components'
import { contract, Loan, LoanStatus } from '../features/web3/contract'
import { infiniteAllowance } from '../features/web3/utils'
import {
    selectManagerAddress,
    selectTokenContract,
    selectTokenDecimals,
} from '../features/web3/web3Slice'

const Manage: NextPage = () => {
    const account = useAccount()
    const managerAddress = useSelector(selectManagerAddress)

    return (
        <Page>
            <Head>
                <title>Earn - {APP_NAME}</title>
                <meta
                    name="description"
                    content="" // TODO: Fix
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {managerAddress ? (
                managerAddress === account ? (
                    <>
                        <Stake />
                        <Unstake />
                        <ApproveLoans />
                    </>
                ) : (
                    <h3>Login with manager wallet</h3>
                )
            ) : (
                <h3>Loading…</h3>
            )}

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
        </Page>
    )
}

export default Manage

function Stake() {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState('100')
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const provider = useProvider()

    if (
        !tokenContract ||
        !account ||
        !provider ||
        tokenDecimals === undefined
    ) {
        return null
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()
        setLoading(true)

        const amount = parseUnits(value, tokenDecimals)
        const signer = provider.getSigner()

        tokenContract
            .allowance(account, CONTRACT_ADDRESS)
            .then(async (allowance) => {
                const tokenContractWithSigner = tokenContract.connect(signer)
                const balance = await tokenContractWithSigner.balanceOf(account)

                if (balance.lt(amount)) {
                    alert('USDC balance too low')
                    setLoading(false)
                    return
                }

                if (amount.gt(allowance)) {
                    await tokenContractWithSigner.approve(
                        CONTRACT_ADDRESS,
                        infiniteAllowance,
                    )

                    await timeout(500)
                }

                await contract.connect(signer).stake(amount)

                // TODO: In page notification

                setLoading(false)
            })
    }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Stake</h4>
            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={loading}>Stake</button>
        </form>
    )
}

function Unstake() {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState('100')
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const provider = useProvider()

    if (
        !tokenContract ||
        !account ||
        !provider ||
        tokenDecimals === undefined
    ) {
        return null
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()
        setLoading(true)

        const amount = parseUnits(value, tokenDecimals)
        const signer = provider.getSigner()

        contract.amountUnstakeable().then(async (unstakableAmount) => {
            if (amount.gt(unstakableAmount)) {
                alert(
                    `Maximum unstakable amount is ${formatUnits(
                        unstakableAmount,
                        tokenDecimals,
                    )}`,
                )
                setLoading(false)
                return
            }

            await contract.connect(signer).unstake(amount)

            // TODO: In page notification

            setLoading(false)
        })
    }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Unstake</h4>
            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={loading}>Unstake</button>
        </form>
    )
}

function ApproveLoans() {
    const [loading, setLoading] = useState(true)
    const [requestedLoans, setRequestedLoans] = useState<Loan[]>(() => [])
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const provider = useProvider()

    const ref = useRef(false)
    useEffect(() => {
        if (ref.current) return
        ref.current = true

        contract
            .queryFilter(contract.filters.LoanRequested())
            .then(async (results) => {
                const loans = await Promise.all(
                    results.map((loan) => contract.loans(loan.args.loanId)),
                )
                setRequestedLoans(
                    loans.filter((loan) => loan.status === LoanStatus.APPLIED),
                )
                setLoading(false)
            })
    }, [])

    if (
        !tokenContract ||
        !account ||
        !provider ||
        tokenDecimals === undefined
    ) {
        return null
    }

    return (
        <div className="section">
            <h4>Loans pending approval</h4>
            {loading && <h3>Loading…</h3>}
            {requestedLoans.map((loan) => (
                <table key={loan.id.toNumber()}>
                    <tbody>
                        <tr>
                            <td>Borrower</td>
                            <td>
                                <EtherscanLink address={loan.borrower} />
                            </td>
                        </tr>
                        <tr>
                            <td>Amount</td>
                            <td>
                                {formatUnits(loan.amount, tokenDecimals)}{' '}
                                {TOKEN_SYMBOL}
                            </td>
                        </tr>
                        <tr>
                            <td>Requested</td>
                            <td>
                                <TimeAgo
                                    datetime={
                                        loan.requestedTime.toNumber() * 1000
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ paddingTop: 10 }}>
                                <Button
                                    onClick={() => {
                                        const { id } = loan
                                        contract
                                            .connect(provider.getSigner())
                                            .approveLoan(loan.id)
                                            .then(() => {
                                                setRequestedLoans(
                                                    (requestedLoans) =>
                                                        requestedLoans.filter(
                                                            (loan) =>
                                                                !loan.id.eq(id),
                                                        ),
                                                )
                                            })
                                    }}
                                >
                                    Approve
                                </Button>
                                <Button
                                    red
                                    onClick={() => {
                                        const { id } = loan
                                        contract
                                            .connect(provider.getSigner())
                                            .denyLoan(loan.id)
                                            .then(() => {
                                                setRequestedLoans(
                                                    (requestedLoans) =>
                                                        requestedLoans.filter(
                                                            (loan) =>
                                                                !loan.id.eq(id),
                                                        ),
                                                )
                                            })
                                    }}
                                >
                                    Reject
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            ))}
        </div>
    )
}
