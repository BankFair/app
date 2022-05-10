import { formatUnits } from '@ethersproject/units'
import { useEffect, useState } from 'react'
import { EtherscanLink } from './EtherscanLink'
import { contract, Pool, useLoans } from '../features'

export function PoolStats({
    pool: { managerAddress, tokenDecimals },
    poolAddress,
}: {
    pool: Pool
    poolAddress: string
}) {
    const stats = useStats(poolAddress, tokenDecimals)

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

function useStats(poolAddress: string, tokenDecimals: number) {
    const loans = useLoans(poolAddress)
    const [state, setState] = useState<{
        loans: number
        managerFunds: string
        availableForDeposits: string
        totalPoolSize: string
        loansOutstanding: string
        maxPoolSize: string
    } | null>(null)

    useEffect(() => {
        const attached = contract.attach(poolAddress)
        let canceled = false
        Promise.all([
            attached.loansCount(),
            attached.balanceStaked(),
            attached.amountDepositable(),
            attached.poolFunds(),
            attached.poolLiquidity(),
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
    }, [setState, loans, tokenDecimals, poolAddress])

    return state
}
