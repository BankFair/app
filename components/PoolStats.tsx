import { formatUnits } from '@ethersproject/units'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { EtherscanLink } from './EtherscanLink'
import { contract } from '../features/web3/contract'
import {
    selectLoans,
    selectManagerAddress,
    selectTokenDecimals,
} from '../features/web3/web3Slice'

export function PoolStats() {
    const stats = useStats()
    const managerAddress = useSelector(selectManagerAddress)

    return (
        <div className="section">
            <h4>
                Manager:{' '}
                {managerAddress && <EtherscanLink address={managerAddress} />}
            </h4>
            <table>
                <tbody>
                    <tr>
                        <td>Total Pool Size</td>
                        <td>${stats?.totalPoolSize || 0}</td>
                    </tr>
                    <tr>
                        <td>Loans Outstanding</td>
                        <td>${stats?.loansOutstanding || 0}</td>
                    </tr>
                    <tr>
                        <td>Manager Funds</td>
                        <td>${stats?.managerFunds || 0}</td>
                    </tr>
                    <tr>
                        <td>Max Pool Size</td>
                        <td>${stats?.maxPoolSize || 0}</td>
                    </tr>
                    <tr>
                        <td>Loans</td>
                        <td>{stats?.loans || 0}</td>
                    </tr>
                    <tr>
                        <td>Projected APY</td>
                        <td>0%</td>
                    </tr>
                    <tr>
                        <td>Available for deposits</td>
                        <td>${stats?.availableForDeposits || 0}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

function useStats() {
    const loans = useSelector(selectLoans)
    const tokenDecimals = useSelector(selectTokenDecimals)
    const [state, setState] = useState<{
        loans: number
        managerFunds: string
        availableForDeposits: string
        totalPoolSize: string
        loansOutstanding: string
        maxPoolSize: string
    } | null>(null)

    useEffect(() => {
        if (!tokenDecimals) return

        let canceled = false
        Promise.all([
            contract.loansCount(),
            contract.balanceStaked(),
            contract.amountDepositable(),
            contract.poolFunds(),
            contract.poolLiquidity(),
        ]).then(
            ([
                loansCount,
                balanceStaked,
                amountDepositable,
                poolFunds,
                poolLiquidity,
            ]) => {
                if (canceled) return

                setState({
                    loans: loansCount.toNumber(),
                    managerFunds: formatUnits(balanceStaked, tokenDecimals),
                    availableForDeposits: formatUnits(
                        amountDepositable,
                        tokenDecimals,
                    ),
                    totalPoolSize: formatUnits(poolFunds, tokenDecimals),
                    loansOutstanding: formatUnits(
                        poolFunds.sub(poolLiquidity),
                        tokenDecimals,
                    ),
                    maxPoolSize: formatUnits(
                        poolFunds.add(amountDepositable),
                        tokenDecimals,
                    ),
                })
            },
        )

        return () => {
            canceled = true
        }
    }, [setState, loans, tokenDecimals])

    return state
}
