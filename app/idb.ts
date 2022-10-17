import type { DBSchema } from 'idb'

import { CHAIN_ID } from './constants'

export interface LocalDetail {
    localLoanAmount: string
    localCurrencyCode: string
    fxRate: number
    localInstallmentAmount?: string
    lastLocalInstallmentAmount?: string
}

interface Info {
    name: string
    businessName: string
    email?: string
    phone?: string
    isLocalCurrencyLoan?: boolean
    localDetail: LocalDetail
}

interface Schema extends DBSchema {
    'borrower-info': {
        key: number
        value: Info
    }
}

const dbPromise =
    typeof window === 'undefined'
        ? undefined
        : import('idb').then((idb) =>
              idb.openDB<Schema>(`store-${CHAIN_ID}`, 2, {
                  upgrade(db, oldVersion) {
                      if (oldVersion === 1) {
                          db.deleteObjectStore('borrower-info')
                      }
                      db.createObjectStore('borrower-info')
                  },
              }),
          )

export async function getBorrowerInfo(id: number) {
    if (!dbPromise) return
    return (await dbPromise).get('borrower-info', id)
}

export async function setBorrowerInfo(id: number, info: Info) {
    if (!dbPromise) return
    return (await dbPromise).put('borrower-info', info, id)
}
