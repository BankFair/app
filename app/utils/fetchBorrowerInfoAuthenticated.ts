import { JsonRpcSigner } from '@ethersproject/providers'

import {
    BORROWER_SERVICE_URL,
    LOCAL_STORAGE_BORROWER_INFO_AUTH_KEY_PREFIX,
    oneDay,
} from '../constants'
import { setBorrowerInfo } from '../idb'

export async function fetchBorrowerInfoAuthenticated(
    account: string,
    signer: JsonRpcSigner,
    profileId: string,
    poolAddress: string,
) {
    const key = `${LOCAL_STORAGE_BORROWER_INFO_AUTH_KEY_PREFIX}_${account}`
    let item: { time: string; signature: string }

    try {
        item = JSON.parse(localStorage.getItem(key)!)

        const timeObject = new Date(item.time)
        if (Date.now() - timeObject.getTime() < oneDay) {
            throw ''
        }
    } catch {
        const time = new Date().toISOString()
        const signature = await signer.signMessage(`Authorization ${time}`)

        item = { time, signature }

        localStorage.setItem(key, JSON.stringify(item))
    }

    const response = await fetch(
        `${BORROWER_SERVICE_URL}/profile/${profileId}?${new URLSearchParams({
            ...item,
            poolAddress,
        })}`,
    )

    const info: {
        id: string
        name: string
        email?: string
        phone?: string
        businessName: string
        digest: string
        poolAddress: string
    } = await response.json()

    setBorrowerInfo(profileId, info)

    return info
}
