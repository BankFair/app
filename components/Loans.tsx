import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { useMemo, useState } from 'react'

import { useDispatch } from '../store'
import { disabledBackground, useProvider } from '../app'
import {
    contract,
    CoreContract,
    fetchLoan,
    formatStatus,
    loanDeskContract,
    LoanStatus,
    Pool,
    trackTransaction,
    useLoadAccountLoans,
    useLoadManagerState,
    useLoans,
} from '../features'

import { useAmountForm } from './AmountForm'
import { Button } from './Button'
import { Modal } from './Modal'
import { LoanView } from './LoanView'

const options = (
    <>
        <option value={-1}>all loans</option>
        <option value={LoanStatus.APPLIED}>
            loans {formatStatus(LoanStatus.APPLIED).toLowerCase()}
        </option>
        <option value={LoanStatus.APPROVED}>
            {formatStatus(LoanStatus.APPROVED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.DENIED}>
            {formatStatus(LoanStatus.DENIED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.CANCELLED}>
            {formatStatus(LoanStatus.CANCELLED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.DEFAULTED}>
            {formatStatus(LoanStatus.DEFAULTED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.FUNDS_WITHDRAWN}>
            {formatStatus(LoanStatus.FUNDS_WITHDRAWN).toLowerCase()} loans
        </option>
        <option value={LoanStatus.REPAID}>
            {formatStatus(LoanStatus.REPAID).toLowerCase()} loans
        </option>
    </>
)
export function Loans(props: {
    pool: Pool
    poolAddress: string
    account?: string | undefined
}) {
    const { pool, poolAddress, account } = props

    const showAllLoans = !props.hasOwnProperty('account')

    const provider = useProvider()
    const [filter, setFilter] = useState<LoanStatus | -1>(-1)
    const loans = showAllLoans
        ? useLoans(poolAddress) // eslint-disable-line react-hooks/rules-of-hooks
        : useLoans(poolAddress, account) // eslint-disable-line react-hooks/rules-of-hooks
    const sortedAndFilteredLoans = useMemo(
        () =>
            (filter === -1
                ? loans
                : loans.filter((loan) => loan.status === filter)
            ).sort((a, b) => b.id - a.id),
        [filter, loans],
    )
    const dispatch = useDispatch()
    const [repay, setRepay] = useState<{ id: number; max: BigNumber } | null>(
        null,
    )

    if (showAllLoans) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useLoadManagerState(poolAddress, dispatch, pool)
    } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useLoadAccountLoans(poolAddress, account, dispatch, pool)
    }

    const handleBorrow = useMemo(
        () =>
            showAllLoans
                ? undefined
                : (loanId: number) => {
                      return contract
                          .attach(poolAddress)
                          .connect(provider!.getSigner())
                          .borrow(BigNumber.from(loanId))
                          .then((tx) =>
                              trackTransaction(dispatch, {
                                  name: 'Borrow',
                                  tx,
                              }),
                          )
                  },
        [showAllLoans, poolAddress, provider, dispatch],
    )

    const handleRepay = useMemo(
        () =>
            showAllLoans
                ? undefined
                : (id: number, max: BigNumber) => setRepay({ id, max }),
        [showAllLoans],
    )

    const [handleApprove, handleReject, handleCancel, handleDefault] = useMemo(
        () =>
            showAllLoans
                ? [
                      (loanId: number) => {
                          return contract
                              .attach(poolAddress)
                              .connect(provider!.getSigner())
                              .approveLoan(loanId)
                              .then((tx) =>
                                  trackTransaction(dispatch, {
                                      name: 'Approve loan',
                                      tx,
                                  }),
                              )
                      },
                      (loanId: number) => {
                          return loanDeskContract
                              .attach(pool.loanDeskAddress)
                              .connect(provider!.getSigner())
                              .denyLoan(loanId)
                              .then((tx) =>
                                  trackTransaction(dispatch, {
                                      name: 'Reject loan',
                                      tx,
                                  }),
                              )
                      },
                      (loanId: number) => {
                          return loanDeskContract
                              .attach(pool.loanDeskAddress)
                              .connect(provider!.getSigner())
                              .cancelLoan(loanId)
                              .then((tx) =>
                                  trackTransaction(dispatch, {
                                      name: 'Cancel loan',
                                      tx,
                                  }),
                              )
                      },
                      (loanId: number) => {
                          return contract
                              .attach(poolAddress)
                              .connect(provider!.getSigner())
                              .defaultLoan(loanId)
                              .then((tx) =>
                                  trackTransaction(dispatch, {
                                      name: 'Default loan',
                                      tx,
                                  }),
                              )
                      },
                  ]
                : [],
        [showAllLoans, poolAddress, pool, provider, dispatch],
    )

    const header = (
        <div className="header">
            <style jsx>{`
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .filter {
                    font-size: 14px;
                    display: flex;
                    align-items: center;

                    > :global(select) {
                        margin-left: 4px;
                    }
                }
            `}</style>
            {showAllLoans ? <h2>Loans</h2> : <h2>Your loans</h2>}
            <div className="filter">
                Show{' '}
                <select
                    value={filter}
                    className="xxs"
                    onChange={(event) => setFilter(Number(event.target.value))}
                >
                    {options}
                </select>
            </div>
        </div>
    )

    if (!sortedAndFilteredLoans.length) {
        const filterApplied = filter !== -1
        const emptyState = (
            <div>
                <style jsx>{`
                    div {
                        text-align: center;
                        border-radius: 16px;
                        padding: 30px 0;
                        background-color: ${disabledBackground};
                        color: var(--disabled-80);
                    }
                `}</style>
                {filterApplied
                    ? 'No loans match the filter'
                    : showAllLoans
                    ? 'No loans have been requested yet'
                    : "You haven't requested any loans yet"}
                {filterApplied ? (
                    <Button
                        onClick={() => setFilter(-1)}
                        style={{ display: 'block', margin: '10px auto 0' }}
                    >
                        Clear filter
                    </Button>
                ) : null}
            </div>
        )

        return (
            <>
                {header}
                {emptyState}
            </>
        )
    }

    const loansElement = (
        <div className="loans">
            <style jsx>{`
                .loans {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-start;

                    > :global(.loan) {
                        flex-basis: 100%;
                    }

                    @media screen and (min-width: 850px) {
                        > :global(.loan) {
                            flex-basis: calc(50% - 8px);

                            &:nth-child(2n - 1) {
                                margin-right: 8px;
                            }

                            &:nth-child(2n) {
                                margin-left: 8px;
                            }
                        }
                    }
                }
            `}</style>

            {sortedAndFilteredLoans.map((loan) => (
                <LoanView
                    key={loan.id}
                    loan={loan}
                    liquidityTokenDecimals={pool.liquidityTokenDecimals}
                    showAll={showAllLoans}
                    onBorrow={handleBorrow}
                    onRepay={handleRepay}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCancel={handleCancel}
                    onDefault={handleDefault}
                    poolAddress={poolAddress}
                    account={pool.managerAddress}
                />
            ))}

            {repay ? (
                <RepayModal
                    poolAddress={poolAddress}
                    loanId={repay.id}
                    liquidityTokenDecimals={pool.liquidityTokenDecimals}
                    liquidityTokenAddress={pool.liquidityTokenAddress}
                    max={repay.max}
                    onClose={() => setRepay(null)}
                />
            ) : null}
        </div>
    )

    return (
        <>
            {header}
            {loansElement}
        </>
    )
}

function RepayModal({
    poolAddress,
    loanId,
    liquidityTokenAddress,
    liquidityTokenDecimals,
    max,
    onClose,
}: {
    poolAddress: string
    loanId: number
    liquidityTokenAddress: string
    liquidityTokenDecimals: number
    max: BigNumber
    onClose(): void
}) {
    const dispatch = useDispatch()

    const { form } = useAmountForm({
        liquidityTokenAddress,
        liquidityTokenDecimals,
        poolAddress,
        onSumbit: (contract: CoreContract, amount: string) =>
            contract.repay(
                BigNumber.from(loanId),
                parseUnits(amount, liquidityTokenDecimals),
            ),
        refetch: () =>
            dispatch(fetchLoan({ poolAddress, loanId })).then(onClose),
        max,
        disabled: false,
        type: 'Repay',
    })

    return (
        <Modal onClose={onClose} autoWidth>
            <div>
                <style jsx>{`
                    div {
                        padding: 16px 24px;

                        > :global(form) {
                            margin: 0;
                        }
                    }
                    h3 {
                        text-align: center;
                        margin: 0 0 8px;
                    }
                `}</style>
                <h3>Repay</h3>
                {form}
            </div>
        </Modal>
    )
}
