import { parseUnits, formatUnits } from '@ethersproject/units'
import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useState } from 'react'
import { useSelector } from 'react-redux'
import {
    APP_NAME,
    CONTRACT_ADDRESS,
    timeout,
    useAccount,
    useProvider,
} from '../app'
import { Page } from '../components'
import { contract } from '../features/web3/contract'
import { infiniteAllowance } from '../features/web3/utils'
import {
    selectManagerAddress,
    selectTokenContract,
    selectTokenDecimals,
} from '../features/web3/web3Slice'

const title = `Earn - ${APP_NAME}`

const Home: NextPage = () => {
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

            <Deposit />
        </Page>
    )
}

export default Home

function Deposit() {
    const [loading, setLoading] = useState(false)
    const [value, setValue] = useState('100')
    const managerAddress = useSelector(selectManagerAddress)
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const provider = useProvider()

    const isManager = managerAddress === account
    const disabled =
        !tokenContract ||
        !account ||
        !provider ||
        tokenDecimals === undefined ||
        isManager

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = disabled
        ? undefined
        : (event) => {
              event.preventDefault()
              setLoading(true)

              const amount = parseUnits(value, tokenDecimals)
              const signer = provider.getSigner()

              // TODO: Handle user cancelation
              contract.amountDepositable().then(async (depositableAmount) => {
                  if (amount.gt(depositableAmount)) {
                      alert(
                          `Maximum depositable amount is ${formatUnits(
                              depositableAmount,
                              tokenDecimals,
                          )}`,
                      ) // TODO: Display in component
                      setLoading(false)
                      return
                  }

                  const allowance = await tokenContract.allowance(
                      account,
                      CONTRACT_ADDRESS,
                  )
                  const tokenContractWithSigner = tokenContract.connect(signer)
                  const balance = await tokenContractWithSigner.balanceOf(
                      account,
                  )

                  if (balance.lt(amount)) {
                      alert('USDC balance too low') // TODO: Display in component
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

                  await contract.connect(signer).deposit(amount)

                  // TODO: In page notification

                  setLoading(false)
              })
          }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Deposit</h4>

            {isManager && <div>Manager can not deposit</div>}

            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={disabled || loading}>Deposit</button>
        </form>
    )
}
