import { NextPage } from 'next'
import Link from 'next/link'
import { POOLS } from '../app'
import { Page } from '../components'

const EarnPools: NextPage = () => {
    return (
        <Page>
            <ul>
                {POOLS.map(({ address, name }) => (
                    <li key={address}>
                        <Link href={`/earn/${address}`}>
                            <a>{name}</a>
                        </Link>
                    </li>
                ))}
            </ul>
        </Page>
    )
}

export default EarnPools
