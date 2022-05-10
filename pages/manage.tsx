import { NextPage } from 'next'
import Link from 'next/link'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAccount } from '../app'
import { Page } from '../components'
import { selectPools } from '../features'

const ManagePools: NextPage = () => {
    const account = useAccount()
    const state = useSelector(selectPools)
    const pools = useMemo(
        () =>
            Object.keys(state).filter(
                (address) => state[address].managerAddress === account,
            ),
        [state, account],
    )

    return (
        <Page>
            <ul>
                {pools.map((address) => (
                    <li key={address}>
                        <Link href={`/manage/${address}`}>
                            <a>{state[address].name}</a>
                        </Link>
                    </li>
                ))}
            </ul>
        </Page>
    )
}

export default ManagePools
