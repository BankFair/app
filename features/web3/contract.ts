import { BaseContract, ContractFunction, ethers } from 'ethers'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { CONTRACT_ADDRESS } from '../../app'
import abi from './abi.json'
import provider from './provider'
import { setManager } from './web3Slice'

interface CoreContract extends BaseContract {
    manager: ContractFunction<string>
}

const contract = new ethers.Contract(
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
            dispatch(setManager(manager))
        })
    }, [dispatch])
}
