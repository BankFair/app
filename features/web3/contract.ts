import { BaseContract, BigNumber, Contract } from 'ethers'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { CONTRACT_ADDRESS } from '../../app'
import abi from './abi.json'
import provider from './provider'
import {
    setManagerAddress,
    setTokenAddress,
    setTokenDecimals,
} from './web3Slice'
import { ContractFunction, CustomBaseContract, getERC20Contract } from './utils'

interface CoreContract extends CustomBaseContract {
    manager: ContractFunction<string>
    token: ContractFunction<string>
    stake: ContractFunction<void, [BigNumber]>
    unstake: ContractFunction<void, [BigNumber]>
    deposit: ContractFunction<void, [BigNumber]>
    withdraw: ContractFunction<void, [BigNumber]>
    amountDepositable: ContractFunction<BigNumber>
    amountUnstakeable: ContractFunction<BigNumber>
    amountWithdrawable: ContractFunction<BigNumber>
}

export const contract = new Contract(
    CONTRACT_ADDRESS,
    abi,
    provider,
) as CoreContract

export function useFetchContractPropertiesOnce() {
    const dispatch = useDispatch()
    const ref = useRef(false)
    useEffect(() => {
        if (typeof window !== 'object' || ref.current) return
        // https://github.com/reactwg/react-18/discussions/18
        // Read "Effects that should only run once can use a ref"
        ref.current = true

        contract.manager().then((manager) => {
            dispatch(setManagerAddress(manager))
        })
        contract.token().then((token) => {
            dispatch(setTokenAddress(token))

            const tokenContract = getERC20Contract(token)
            tokenContract.decimals().then((decimals) => {
                dispatch(setTokenDecimals(decimals))
            })
        })
    }, [dispatch])
}
