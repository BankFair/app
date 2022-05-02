import { formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import { useDispatch } from 'react-redux'
import TimeAgo from 'timeago-react'

import { TOKEN_SYMBOL } from '../app'

import { CoreContract, fetchAndUpdateLoan } from '../features/web3/contract'
import { LoanStatus } from '../features/web3/utils'
import { Loan } from '../features/web3/web3Slice'

import { ActionButton } from './ActionButton'
import { EtherscanLink } from './EtherscanLink'

export function LoanView({
    loan: { borrower, amount, requestedTime, id, status },
    tokenDecimals,
    getContract,
    approve,
    borrow,
}: {
    loan: Loan
    tokenDecimals: number
    getContract?: () => CoreContract
    approve?: boolean
    borrow?: boolean
}) {
    if (process.env.NODE_ENV === 'development') {
        if (approve && borrow) {
            throw new Error(
                '`approve` and `borrow` can not be enabled at the same time',
            )
        }
    }

    const dispatch = useDispatch()

    return (
        <table>
            <tbody>
                <tr>
                    <td>Borrower</td>
                    <td>
                        <EtherscanLink address={borrower} />
                    </td>
                </tr>
                <tr>
                    <td>Amount</td>
                    <td>
                        {formatUnits(amount, tokenDecimals)} {TOKEN_SYMBOL}
                    </td>
                </tr>
                <tr>
                    <td>Requested</td>
                    <td>
                        <TimeAgo datetime={requestedTime} />
                    </td>
                </tr>
                <tr>
                    <td>Status</td>
                    <td>{formatStatus(status)}</td>
                </tr>
                {approve && status === LoanStatus.APPLIED && getContract && (
                    <tr>
                        <td colSpan={2} style={{ paddingTop: 10 }}>
                            <ActionButton
                                action={() =>
                                    getContract().approveLoan(
                                        BigNumber.from(id),
                                    )
                                }
                            >
                                Approve
                            </ActionButton>
                            <ActionButton
                                red
                                action={() =>
                                    getContract().denyLoan(BigNumber.from(id))
                                }
                            >
                                Reject
                            </ActionButton>
                        </td>
                    </tr>
                )}
                {borrow && status === LoanStatus.APPROVED && getContract && (
                    <tr>
                        <td colSpan={2} style={{ paddingTop: 10 }}>
                            <ActionButton
                                action={() =>
                                    getContract()
                                        .borrow(BigNumber.from(id))
                                        .then((tx) => tx.wait())
                                        .then(() => fetchAndUpdateLoan(id))
                                        .then(dispatch)
                                }
                            >
                                Borrow
                            </ActionButton>
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    )
}

function formatStatus(status: LoanStatus) {
    switch (status) {
        case LoanStatus.APPLIED:
            return 'Waiting for approval'
        case LoanStatus.APPROVED:
            return 'Approved'
        case LoanStatus.DENIED:
            return 'Rejected'
        case LoanStatus.CANCELLED:
            return 'Cancelled'
        case LoanStatus.DEFAULTED:
            return 'Defaulted'
        case LoanStatus.FUNDS_WITHDRAWN:
            return 'Withdrawn'
        case LoanStatus.REPAID:
            return 'Repaid'
    }
}
