import { parseUnits, formatUnits } from '@ethersproject/units'
import { BigNumber } from '@ethersproject/bignumber'
import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEventHandler, useEffect, useRef, useState } from 'react'
import {
    APP_NAME,
    useAccount,
    useProvider,
    infiniteAllowance,
    getERC20Contract,
    useSelector,
    getAddress,
} from '../../app'
import { Page, PoolStats } from '../../components'
import { contract, Pool, useLoans } from '../../features'

const title = `Earn - ${APP_NAME}`

const Earn: NextPage<{ address: string }> = ({ address }) => {
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

                    table {
                        margin: 0 auto;
                    }
                }

                h3 {
                    text-align: center;
                }
            `}</style>

            {pool ? (
                <>
                    <PoolStats pool={pool} poolAddress={address} />
                    <Deposit pool={pool} poolAddress={address} />
                    <Withdraw pool={pool} poolAddress={address} />
                    <Earnings pool={pool} poolAddress={address} />
                </>
            ) : (
                <h3>Loading…</h3>
            )}
        </Page>
    )
}

Earn.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Earn

function Deposit({
    pool: { managerAddress, tokenAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [value, setValue] = useState('100')
    const account = useAccount()
    const provider = useProvider()

    const isManager = managerAddress === account

    const [deposited, setDeposited] = useState('0')
    const ref = useRef<typeof account>(undefined)
    useEffect(() => {
        if (isManager) return
        if (ref.current === account) return
        ref.current = account

        if (!account) return

        contract
            .attach(poolAddress)
            .balanceOf(account)
            .then((amount) => {
                setDeposited(formatUnits(amount, tokenDecimals))
            })
    }, [account, tokenDecimals, poolAddress, isManager])

    const disabled = !account || !provider || isManager

    const noSubmit = disabled || isLoading

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noSubmit
        ? undefined
        : (event) => {
              event.preventDefault()
              setIsLoading(true)

              const amount = parseUnits(value, tokenDecimals)
              const signer = provider.getSigner()

              const attached = contract.attach(poolAddress)
              const tokenContract = getERC20Contract(tokenAddress)

              // TODO: Handle user cancelation
              attached.amountDepositable().then(async (depositableAmount) => {
                  if (amount.gt(depositableAmount)) {
                      alert(
                          `Maximum depositable amount is ${formatUnits(
                              depositableAmount,
                              tokenDecimals,
                          )}`,
                      ) // TODO: Display in component
                      setIsLoading(false)
                      return
                  }

                  const allowance = await tokenContract.allowance(
                      account,
                      poolAddress,
                  )
                  const tokenContractWithSigner = tokenContract.connect(signer)
                  const balance = await tokenContractWithSigner.balanceOf(
                      account,
                  )

                  if (balance.lt(amount)) {
                      alert('USDC balance too low') // TODO: Display in component
                      setIsLoading(false)
                      return
                  }

                  if (amount.gt(allowance)) {
                      const tx = await tokenContractWithSigner.approve(
                          poolAddress,
                          infiniteAllowance,
                      )

                      await tx.wait()
                  }

                  const tx = await attached.connect(signer).deposit(amount)

                  await tx.wait()

                  setDeposited((deposited) =>
                      formatUnits(
                          parseUnits(deposited, tokenDecimals).add(amount),
                          tokenDecimals,
                      ),
                  )

                  // TODO: In page notification

                  setIsLoading(false)
              })
          }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Deposit</h4>

            {managerAddress &&
                account &&
                (isManager ? (
                    <div>Manager can not deposit</div>
                ) : (
                    <div>You deposited {deposited}</div>
                ))}

            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={noSubmit}>Deposit</button>
        </form>
    )
}

function Withdraw({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [value, setValue] = useState('100')
    const loans = useLoans(poolAddress)
    const account = useAccount()
    const provider = useProvider()

    const isManager = managerAddress === account

    const [withdrawable, setWithdrawable] = useState('0')
    useEffect(() => {
        if (!account) return

        contract
            .attach(poolAddress)
            .amountWithdrawable(account)
            .then((value) => {
                setWithdrawable(formatUnits(value, tokenDecimals))
            })
    }, [
        setWithdrawable,
        account,
        tokenDecimals,
        loans,
        withdrawable,
        poolAddress,
    ])

    const disabled = !account || !provider || isManager

    const noSubmit = disabled || isLoading

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined = noSubmit
        ? undefined
        : (event) => {
              event.preventDefault()
              setIsLoading(true)

              const amount = parseUnits(value, tokenDecimals)

              const attached = contract.attach(poolAddress)

              // TODO: Handle user cancelation
              attached
                  .amountWithdrawable(account)
                  .then(async (withdrawableAmount) => {
                      if (amount.gt(withdrawableAmount)) {
                          alert(
                              `Maximum withdrawable amount is ${formatUnits(
                                  withdrawableAmount,
                                  tokenDecimals,
                              )}`,
                          ) // TODO: Display in component
                          setIsLoading(false)
                          return
                      }

                      const tx = await attached
                          .connect(provider.getSigner())
                          .withdraw(amount)

                      await tx.wait()

                      // TODO: In page notification

                      setIsLoading(false)

                      // TODO: Refresh staked

                      setWithdrawable(
                          formatUnits(
                              parseUnits(withdrawable, tokenDecimals).sub(
                                  amount,
                              ),
                              tokenDecimals,
                          ),
                      )
                  })
          }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Withdraw</h4>

            {managerAddress &&
                account &&
                (isManager ? (
                    <div>Manager can not withdraw</div>
                ) : (
                    <div>
                        Maximum withdrawable:{' '}
                        <a onClick={() => setValue(withdrawable)}>
                            {withdrawable}
                        </a>
                    </div>
                ))}

            <input
                type="number"
                inputMode="decimal"
                onChange={(event) => void setValue(event.target.value)}
                value={value}
            />
            <button disabled={noSubmit}>Withdraw</button>
        </form>
    )
}

function Earnings({
    pool: { tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [earnings, setEarnings] = useState<{
        amount: BigNumber
        account: string
    } | null>(null)
    const account = useAccount()
    const provider = useProvider()

    useEffect(() => {
        if (!account) return
        contract
            .attach(poolAddress)
            .protocolEarningsOf(account)
            .then((earnings) => {
                if (!earnings.gt(BigNumber.from(0))) return
                setEarnings({
                    amount: earnings,
                    account,
                })
            })
    }, [account, setEarnings, poolAddress])

    if (!earnings || !provider) return null

    const handleSubmit: FormEventHandler<HTMLFormElement> | undefined =
        isLoading
            ? undefined
            : (event) => {
                  event.preventDefault()

                  setIsLoading(true)
                  contract
                      .attach(poolAddress)
                      .connect(provider.getSigner())
                      .withdrawProtocolEarnings()
                      .then((tx) => {
                          return tx.wait()
                      })
                      .then(() => {
                          setIsLoading(false)
                          setEarnings({
                              account: account!,
                              amount: BigNumber.from(0),
                          })
                      })
              }

    return (
        <form className="section" onSubmit={handleSubmit}>
            <h4>Earnings</h4>

            <div>
                Your earnings:{' '}
                {earnings &&
                    earnings.account === account &&
                    formatUnits(earnings.amount, tokenDecimals)}
            </div>
            <button
                disabled={isLoading || earnings?.amount.lte(BigNumber.from(0))}
            >
                Withdraw
            </button>
        </form>
    )
}
