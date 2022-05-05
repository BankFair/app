import { parseUnits, formatUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { APP_NAME, CONTRACT_ADDRESS, useAccount, useProvider } from '../app'
import { LoanView, Page } from '../components'
import {
    contract,
    useLoadManagerState,
    useSigner,
} from '../features/web3/contract'
import { infiniteAllowance } from '../features/web3/utils'
import {
    selectLoans,
    selectLoansBlockNumber,
    selectManagerAddress,
    selectTokenContract,
    selectTokenDecimals,
} from '../features/web3/web3Slice'

const title = `Earn - ${APP_NAME}`

const Manage: NextPage = () => {
    const account = useAccount()
    const managerAddress = useSelector(selectManagerAddress)

    useLoadManagerState()

    return (
        <Page>
            <Head>
                <title>{title}</title>
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
                        <Loans />
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

                const tx = await contract.connect(signer).stake(amount)

                await tx.wait()

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

        contract.amountUnstakable().then(async (unstakableAmount) => {
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

            const tx = await contract.connect(signer).unstake(amount)

            await tx.wait()

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

function Loans() {
    const loans = useSelector(selectLoans)
    const loansBlockNumber = useSelector(selectLoansBlockNumber)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const getContract = useSigner()
    const dispatch = useDispatch()

    const loading =
        !loansBlockNumber ||
        !getContract ||
        !account ||
        tokenDecimals === undefined

    const items = loading ? (
        <h3>Loading…</h3>
    ) : (
        loans
            .sort((a, b) => b.id - a.id)
            .map((loan) => (
                <LoanView
                    key={loan.id}
                    loan={loan}
                    account={account}
                    tokenDecimals={tokenDecimals}
                    dispatch={dispatch}
                    getContract={getContract}
                    approve
                />
            ))
    )

    return (
        <div className="section">
            <h4>Loans</h4>
            {items}
        </div>
    )
}
