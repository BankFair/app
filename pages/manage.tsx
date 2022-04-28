import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import { FormEventHandler, useState } from 'react'
import { useSelector } from 'react-redux'
import { CONTRACT_ADDRESS, timeout, useAccount, useProvider } from '../app'
import { Page } from '../components'
import { contract } from '../features/web3/contract'
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
            {managerAddress ? (
                managerAddress === account ? (
                    <>
                        <Stake />
                        <Unstake />
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
                name="value"
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

        contract
            .connect(signer)
            .unstake(amount)
            .then(() => {
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
                name="value"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={loading}>Unstake</button>
        </form>
    )
}
