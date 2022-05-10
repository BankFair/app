import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { APP_NAME, useAccount, useProvider } from '../app'
import { LoanView, Page } from '../components'
import {
    contract,
    useLoadAccountLoans,
    useSigner,
    useTokenContractSigner,
    LoanStatus,
    selectLoans,
    selectManagerAddress,
    selectTokenContract,
    selectTokenDecimals,
} from '../features'

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
                        margin: 15px auto 0;
                    }
                }

                h3 {
                    text-align: center;
                }
            `}</style>

            <RequestLoan />
            <Loans />
        </Page>
    )
}

export default Borrow

function RequestLoan() {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState('100')
    const [duration, setDuration] = useState('86400')
    const managerAddress = useSelector(selectManagerAddress)
    const tokenContract = useSelector(selectTokenContract)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const account = useAccount()
    const provider = useProvider()
    const loans = useSelector(selectLoans)

    const isManager = managerAddress === account
    const disabled =
        !tokenContract ||
        !account ||
        !provider ||
        tokenDecimals === undefined ||
        isManager

    const noSubmit = disabled || isLoading

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined =
        disabled || isLoading
            ? undefined
            : (event) => {
                  event.preventDefault()

                  if (
                      loans.filter(
                          (loan) =>
                              loan.borrower === account &&
                              loan.status === LoanStatus.APPLIED,
                      ).length
                  ) {
                      // TODO: Display in component
                      alert(`A loan you requested is already pending approval`)
                      return
                  }

                  setIsLoading(true)

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
                          setIsLoading(false)
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
                          setIsLoading(false)
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
                          setIsLoading(false)
                          return
                      }

                      // TODO: Handle errors
                      // TODO: Handle user cancelation
                      await contract
                          .connect(signer)
                          .requestLoan(parsedAmount, parsedDuration)

                      // TODO: In page notification

                      setIsLoading(false)
                  })
              }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Request loan</h4>

            {isManager && <div>Manager can not request a loan</div>}

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
            <button disabled={noSubmit}>Request loan</button>
        </form>
    )
}

function Loans() {
    const tokenDecimals = useSelector(selectTokenDecimals)
    const getContract = useSigner()
    const getTokenContractSigner = useTokenContractSigner()
    const account = useAccount()
    const allLoans = useSelector(selectLoans)
    const loans = useMemo(
        () =>
            allLoans
                .filter((loan) => loan.borrower === account)
                .sort((a, b) => b.id - a.id),
        [account, allLoans],
    )
    const dispatch = useDispatch()

    useLoadAccountLoans(account, dispatch)

    if (!tokenDecimals || !account || !getTokenContractSigner) return null

    return (
        <div className="section">
            <h4>Your loans</h4>

            {loans.map((loan) => (
                <LoanView
                    key={loan.id}
                    loan={loan}
                    account={account}
                    tokenDecimals={tokenDecimals}
                    dispatch={dispatch}
                    getContract={getContract}
                    borrow={getTokenContractSigner}
                    hideBorrower
                />
            ))}
        </div>
    )
}
