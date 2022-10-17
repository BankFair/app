import { JsonRpcSigner } from '@ethersproject/providers'

import {
    BORROWER_SERVICE_URL,
    LOCAL_STORAGE_BORROWER_INFO_AUTH_KEY_PREFIX,
    oneDay,
} from '../constants'
import {LocalDetail, setBorrowerInfo} from '../idb'
import { Address } from '../types'

export async function fetchBorrowerInfoAuthenticated(
    poolAddress: Address,
    applicationId: number,
    profileId: string,
    account: Address,
    signer: JsonRpcSigner,
) {
    let item = await authenticateUser(account, signer);

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
        isLocalCurrencyLoan?: boolean
        localDetail: LocalDetail
    } = await response.json()

    setBorrowerInfo(applicationId, info)

    return info
}

export async function authenticateUser(
    account: Address,
    signer: JsonRpcSigner,
) {
    const key = `${LOCAL_STORAGE_BORROWER_INFO_AUTH_KEY_PREFIX}_${account}`
    let item: { time: string; signature: string }

    try {
        item = JSON.parse(localStorage.getItem(key)!)

        const timeObject = new Date(item.time)
        if (Date.now() - timeObject.getTime() > oneDay * 1000) {
            throw ''
        }
    } catch {
        const time = new Date().toISOString()
        const signature = await signer.signMessage(`Authorization ${time}`)

        item = { time, signature }

        localStorage.setItem(key, JSON.stringify(item))
    }

    return item;
}
