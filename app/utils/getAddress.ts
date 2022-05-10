import { getAddress as parseAddress } from '@ethersproject/address'

export function getAddress(address: any): string {
    try {
        return parseAddress(address as string)
    } catch {
        return ''
    }
}
