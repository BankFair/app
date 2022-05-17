import { useSelector } from 'react-redux'
import { useFetchIntervalAllowanceAndBalance } from './erc20Slice'
import { infiniteAllowance } from '../../app'
import type { AppState } from '../../store'
import { BigNumber } from '@ethersproject/bignumber'

export function useAllowanceAndBalance(
    token: string,
    spender: string,
    account: string | undefined,
) {
    const allowance = useSelector(
        createAllowanceSelector(token, spender, account),
    )
    const balance = useSelector(createBalanceSelector(token, account))

    // TODO: Stop fetching when `document.visibilityState` is `hidden`
    const refetch = useFetchIntervalAllowanceAndBalance(
        account ? { token, spender, account } : null,
    )

    return { allowance, balance, refetch }
}

function createAllowanceSelector(
    token: string,
    spender: string,
    account: string | undefined,
) {
    return (state: AppState) =>
        account
            ? state.erc20.allowances.find(
                  (allowance) =>
                      allowance.account === account &&
                      allowance.token === token &&
                      allowance.spender === spender,
              )?.allowance
            : undefined
}

function createBalanceSelector(token: string, account: string | undefined) {
    return (state: AppState) =>
        account
            ? state.erc20.balances.find(
                  (balance) =>
                      balance.account === account && balance.token === token,
              )?.balance
            : undefined
}

const infiniteAllowanceBigNumber = BigNumber.from(infiniteAllowance)
export function isAllowanceInfinite(allowance: string) {
    return infiniteAllowanceBigNumber.eq(allowance)
}
