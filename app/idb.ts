import type { DBSchema } from 'idb'

import { CHAIN_ID } from './constants'

interface Info {
    name: string
    businessName: string
    email?: string
    phone?: string
}

interface Schema extends DBSchema {
    'borrower-info': {
        key: string
        value: Info
    }
}

const dbPromise =
    typeof window === 'undefined'
        ? undefined
        : import('idb').then((idb) =>
              idb.openDB<Schema>(`store-${CHAIN_ID}`, 1, {
                  upgrade(db) {
                      db.createObjectStore('borrower-info')
                  },
              }),
          )

export async function getBorrowerInfo(id: string) {
    if (!dbPromise) return
    return (await dbPromise).get('borrower-info', id)
}

export async function setBorrowerInfo(id: string, info: Info) {
    if (!dbPromise) return
    return (await dbPromise).put('borrower-info', info, id)
}
