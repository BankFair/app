import { Address, Hexadecimal } from './types'
import { CHAIN_ID, chains } from './constants'
import {LocalDetail} from "./idb";


export async function getBorrowerMetadata(account: string) {
    let info = applicants[account];
    if (!info) {
        info = {
            name: 'Unlisted',
            businessName: 'Unlisted'
        }
    }
    return info as Promise<{
        name: string
        businessName: string
        phone?: string
        email?: string
        isLocalCurrencyLoan?: boolean
        localDetail: LocalDetail
    }>;
}

export const applicants: Record<string, any> =
    CHAIN_ID === chains.polygon
        //polygon mainnet metadata
        ? {

        }

        //testnet metadata, and a catch-all for non Polygon networks
        :
        {
            '0xDf4873F424067F6C5A0c2e60acAaC93D7BB475a6':
                {
                    name: 'John Smith',
                    businessName: 'Example Uganda SACCO'
                },
            '0xA7b1c4c8c2d176b99AC3C4F65d7e3A4D0E41d622':
                {
                    name: 'Sam Smith',
                    businessName: 'Example Kenya SACCO'
                },
        }

