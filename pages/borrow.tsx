import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { NextPage } from 'next'
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
    selectTokenContract,
    selectTokenDecimals,
} from '../features/web3/web3Slice'

const title = `Borrow - ${APP_NAME}`

const Borrow: NextPage = () => {
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

                    > table {
                        margin: 0 auto;
                    }
                }

                h3 {
                    text-align: center;
                }
            `}</style>

            <RequestLoan />
        </Page>
    )
}

export default Borrow

function RequestLoan() {
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState('100')
    const [duration, setDuration] = useState('86400')
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const provider = useProvider()

    const disabled =
        !tokenContract || !account || !provider || tokenDecimals === undefined

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = disabled
        ? undefined
        : (event) => {
              event.preventDefault()
              setLoading(true)

              const parsedAmount = parseUnits(amount, tokenDecimals)
              const parsedDuration = BigNumber.from(duration)
              const signer = provider.getSigner()

              Promise.all([
                  contract.minAmount(),
                  contract.minDuration(),
                  contract.maxDuration(),
              ]).then(async ([minAmount, minDuration, maxDuration]) => {
                  if (parsedAmount.lt(minAmount)) {
                      // TODO: Display in component
                      alert(
                          `Amount must be higher than ${formatUnits(
                              minAmount,
                              tokenDecimals,
                          )}`,
                      )
                      setLoading(false)
                      return
                  }

                  if (parsedDuration.lt(minDuration)) {
                      // TODO: Display in component
                      alert(
                          `Amount must be higher than ${formatUnits(
                              minDuration,
                              tokenDecimals,
                          )}`,
                      )
                      setLoading(false)
                      return
                  }

                  if (parsedDuration.gt(maxDuration)) {
                      // TODO: Display in component
                      alert(
                          `Amount must be lower than ${formatUnits(
                              maxDuration,
                              tokenDecimals,
                          )}`,
                      )
                      setLoading(false)
                      return
                  }

                  // TODO: Handle errors
                  // TODO: Handle user cancelation
                  await contract
                      .connect(signer)
                      .requestLoan(parsedAmount, parsedDuration)

                  // TODO: In page notification

                  setLoading(false)
              })
          }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Request loan</h4>
            <table>
                <tbody>
                    <tr>
                        <td>Amount</td>
                        <td>
                            <input
                                type="number"
                                inputMode="decimal"
                                onChange={(event) => {
                                    setAmount(event.target.value)
                                }}
                                value={amount}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Duration</td>
                        <td>
                            <input
                                type="number"
                                inputMode="decimal"
                                onChange={(event) => {
                                    setDuration(event.target.value)
                                }}
                                value={duration}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
            <button disabled={disabled || loading}>Request loan</button>
        </form>
    )
}
