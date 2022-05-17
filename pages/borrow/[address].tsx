import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { APP_NAME, getAddress, useAccount, useProvider } from '../../app'
import { LoanView, Page } from '../../components'
import {
    contract,
    useLoadAccountLoans,
    useSigner,
    useTokenContractSigner,
    LoanStatus,
    Pool,
    useLoans,
} from '../../features'
import { useSelector } from '../../store'

const title = `Borrow - ${APP_NAME}`

const Borrow: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])

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
            {pool ? (
                <>
                    <RequestLoan pool={pool} poolAddress={address} />
                    <Loans pool={pool} poolAddress={address} />
                </>
            ) : (
                <h3>Loading…</h3>
            )}
        </Page>
    )
}

Borrow.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Borrow

function RequestLoan({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState('100')
    const [duration, setDuration] = useState('86400')
    const account = useAccount()
    const provider = useProvider()
    const loans = useLoans(poolAddress)

    const isManager = managerAddress === account
    const disabled = !account || !provider || isManager

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

                  const attached = contract.attach(poolAddress)

                  Promise.all([
                      attached.minAmount(),
                      attached.minDuration(),
                      attached.maxDuration(),
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
                      await attached
                          .connect(provider.getSigner())
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

function Loans({ pool, poolAddress }: { pool: Pool; poolAddress: string }) {
    const getContract = useSigner(poolAddress)
    const getTokenContractSigner = useTokenContractSigner(pool.tokenAddress)
    const account = useAccount()
    const allLoans = useLoans(poolAddress)
    const loans = useMemo(
        () =>
            allLoans
                .filter((loan) => loan.borrower === account)
                .sort((a, b) => b.id - a.id),
        [account, allLoans],
    )
    const dispatch = useDispatch()

    useLoadAccountLoans(poolAddress, account, dispatch, pool)

    if (!account || !getTokenContractSigner) return null

    const { tokenDecimals } = pool

    return (
        <div className="section">
            <h4>Your loans</h4>

            {loans.map((loan) => (
                <LoanView
                    key={loan.id}
                    loan={loan}
                    account={account}
                    tokenDecimals={tokenDecimals}
                    poolAddress={poolAddress}
                    dispatch={dispatch}
                    getContract={getContract}
                    borrow={getTokenContractSigner}
                    hideBorrower
                />
            ))}
        </div>
    )
}
