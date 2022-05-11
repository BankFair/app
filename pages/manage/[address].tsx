import { parseUnits, formatUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import {
    APP_NAME,
    useAccount,
    useProvider,
    infiniteAllowance,
    useSelector,
    getERC20Contract,
    getAddress,
} from '../../app'
import { LoanView, Page } from '../../components'
import {
    contract,
    Pool,
    useLoadManagerState,
    useLoans,
    useSigner,
} from '../../features'

const title = `Earn - ${APP_NAME}`

const Manage: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const account = useAccount()

    useLoadManagerState(address, pool)

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

            {pool ? (
                pool.managerAddress === account ? (
                    <>
                        <Stake pool={pool} poolAddress={address} />
                        <Unstake pool={pool} poolAddress={address} />
                        <Loans pool={pool} poolAddress={address} />
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

Manage.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Manage

function Stake({
    pool: { tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState('100')
    const account = useAccount()
    const provider = useProvider()

    const [staked, setStaked] = useState('0')
    useEffect(() => {
        contract
            .attach(poolAddress)
            .balanceStaked()
            .then((amount) => {
                setStaked(formatUnits(amount, tokenDecimals))
            })
    }, [account, tokenDecimals, poolAddress])

    if (!account || !provider || tokenDecimals === undefined) {
        return null
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()
        setLoading(true)

        const amount = parseUnits(value, tokenDecimals)
        const signer = provider.getSigner()
        const tokenContract = getERC20Contract(tokenAddress)

        tokenContract
            .allowance(account, poolAddress)
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
                        poolAddress,
                        infiniteAllowance,
                    )

                    await tx.wait()
                }

                const tx = await contract
                    .attach(poolAddress)
                    .connect(signer)
                    .stake(amount)

                await tx.wait()

                setStaked((staked) =>
                    formatUnits(
                        parseUnits(staked, tokenDecimals).add(amount),
                        tokenDecimals,
                    ),
                )

                // TODO: In page notification

                setLoading(false)
            })
    }

    return (
        <form className="section" onSubmit={loading ? undefined : handleSubmit}>
            <h4>Stake</h4>
            <div>Staked: {staked}</div>
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

function Unstake({
    pool: { tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState('100')
    const loans = useLoans(poolAddress)
    const provider = useProvider()

    const [unstakable, setUnstakable] = useState('')
    useEffect(() => {
        if (!tokenDecimals) return
        contract
            .attach(poolAddress)
            .amountUnstakable()
            .then((value) => setUnstakable(formatUnits(value, tokenDecimals)))
    }, [setUnstakable, poolAddress, tokenDecimals, loans, unstakable])

    if (!provider) return null

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault()
        setLoading(true)

        const amount = parseUnits(value, tokenDecimals)
        const attached = contract.attach(poolAddress)

        attached.amountUnstakable().then(async (unstakableAmount) => {
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

            const tx = await attached
                .connect(provider.getSigner())
                .unstake(amount)

            await tx.wait()

            // TODO: In page notification
            // TODO: Refresh staked amount

            setLoading(false)
            setUnstakable(
                formatUnits(
                    parseUnits(unstakable, tokenDecimals).sub(amount),
                    tokenDecimals,
                ),
            )
        })
    }

    return (
        <form className="section" onSubmit={loading ? undefined : handleSubmit}>
            <h4>Unstake</h4>
            {unstakable && (
                <div>
                    Maximum unstakable:{' '}
                    <a onClick={() => setValue(unstakable)}>{unstakable}</a>
                </div>
            )}
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

function Loans({
    pool: { tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const loans = useLoans(poolAddress)
    const loansBlockNumber = useSelector(
        (s) => s.pools[poolAddress].loansBlockNumber,
    )
    const account = useAccount()
    const getContract = useSigner(poolAddress)
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
                    poolAddress={poolAddress}
                    dispatch={dispatch}
                    getContract={getContract}
                    manage
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
