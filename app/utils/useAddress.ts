import { getAddress } from '@ethersproject/address'
import { useMemo } from 'react'

export function useAddress(address: string) {
    return useMemo(() => getAddress(address), [address])
}
