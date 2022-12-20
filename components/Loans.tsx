import { BigNumber } from '@ethersproject/bignumber'
import { useMemo, useState } from 'react'

import { useDispatch } from '../store'
import { Address, disabledBackground } from '../app'
import {
    CoreContract,
    fetchLoan,
    formatStatus,
    LoanDeskContract,
    LoanStatus,
    Pool,
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
        <option value={LoanStatus.DEFAULTED}>
            {formatStatus(LoanStatus.DEFAULTED).toLowerCase()} loans
        </option>
        <option value={LoanStatus.OUTSTANDING}>
            {formatStatus(LoanStatus.OUTSTANDING).toLowerCase()} loans
        </option>
        <option value={LoanStatus.REPAID}>
            {formatStatus(LoanStatus.REPAID).toLowerCase()} loans
        </option>
    </>
)
export function Loans(props: {
    pool: Pool
    poolAddress: Address
    account?: string | undefined
}) {
    const { pool, poolAddress, account } = props

    const showAllLoans = !props.hasOwnProperty('account')

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
        useLoadManagerState(poolAddress, pool.loanDeskAddress, dispatch, pool)
    } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useLoadAccountLoans(poolAddress, account, dispatch, pool)
    }

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
                    poolAddress={poolAddress}
                    loanDeskAddress={pool.loanDeskAddress}
                />
            ))}
        </div>
    )

    return (
        <>
            {header}
            {loansElement}
        </>
    )
}
