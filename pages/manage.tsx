import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useState } from 'react'
import { useSelector } from 'react-redux'
import TimeAgo from 'timeago-react'
import {
    APP_NAME,
    CONTRACT_ADDRESS,
    TOKEN_SYMBOL,
    useAccount,
    useProvider,
} from '../app'
import { EtherscanLink, Page } from '../components'
import { ActionButton } from '../components/ActionButton'
import { contract, CoreContract, useSigner } from '../features/web3/contract'
import { infiniteAllowance } from '../features/web3/utils'
import {
    Loan,
    selectApprovedLoans,
    selectLoansTimestamp,
    selectManagerAddress,
    selectRejectedLoans,
    selectRequestedLoans,
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
                        <ApprovedLoans />
                        <RejectedLoans />
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
                    const tx = await tokenContractWithSigner.approve(
                        CONTRACT_ADDRESS,
                        infiniteAllowance,
                    )

                    await tx.wait()
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
    const provider = useProvider()

    if (!tokenContract || !provider || tokenDecimals === undefined) {
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
    const loans = useSelector(selectRequestedLoans)
    const loansTimestamp = useSelector(selectLoansTimestamp)
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const getContract = useSigner()

    const loading =
        !loansTimestamp ||
        !tokenContract ||
        !getContract ||
        tokenDecimals === undefined

    const items = loading ? (
        <h3>Loading…</h3>
    ) : (
        loans.map((loan) => (
            <LoanView
                key={loan.id}
                loan={loan}
                tokenDecimals={tokenDecimals}
                getContract={getContract}
            />
        ))
    )

    return (
        <div className="section">
            <h4>Loans pending approval</h4>
            {items}
        </div>
    )
}

function ApprovedLoans() {
    const loans = useSelector(selectApprovedLoans)
    const loansTimestamp = useSelector(selectLoansTimestamp)
    const tokenDecimals = useSelector(selectTokenDecimals)

    const loading = !loansTimestamp || tokenDecimals === undefined

    const items = loading ? (
        <h3>Loading…</h3>
    ) : (
        loans.map((loan) => (
            <LoanView key={loan.id} loan={loan} tokenDecimals={tokenDecimals} />
        ))
    )

    return (
        <div className="section">
            <h4>Approved loans</h4>
            {items}
        </div>
    )
}

function RejectedLoans() {
    const loans = useSelector(selectRejectedLoans)
    const loansTimestamp = useSelector(selectLoansTimestamp)
    const tokenDecimals = useSelector(selectTokenDecimals)

    const loading = !loansTimestamp || tokenDecimals === undefined

    const items = loading ? (
        <h3>Loading…</h3>
    ) : (
        loans.map((loan) => (
            <LoanView key={loan.id} loan={loan} tokenDecimals={tokenDecimals} />
        ))
    )

    return (
        <div className="section">
            <h4>Rejected loans</h4>
            {items}
        </div>
    )
}

function LoanView({
    loan: { borrower, amount, requestedTime, id },
    tokenDecimals,
    getContract,
}: {
    loan: Loan
    tokenDecimals: number
    getContract?: () => CoreContract
}) {
    return (
        <table>
            <tbody>
                <tr>
                    <td>Borrower</td>
                    <td>
                        <EtherscanLink address={borrower} />
                    </td>
                </tr>
                <tr>
                    <td>Amount</td>
                    <td>
                        {formatUnits(amount, tokenDecimals)} {TOKEN_SYMBOL}
                    </td>
                </tr>
                <tr>
                    <td>Requested</td>
                    <td>
                        <TimeAgo datetime={requestedTime} />
                    </td>
                </tr>
                {getContract && (
                    <tr>
                        <td colSpan={2} style={{ paddingTop: 10 }}>
                            <ActionButton
                                action={() =>
                                    getContract().approveLoan(
                                        BigNumber.from(id),
                                    )
                                }
                            >
                                Approve
                            </ActionButton>
                            <ActionButton
                                red
                                action={() =>
                                    getContract().denyLoan(BigNumber.from(id))
                                }
                            >
                                Reject
                            </ActionButton>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}
