import { LENDER_SERVICE_URL } from '../constants'
import { Address } from '../types'

export async function fetchLenderAccess(address: Address): Promise<boolean> {
    const response = await fetch(`${LENDER_SERVICE_URL}/profile/${address}`)
    return response.status === 200
}
