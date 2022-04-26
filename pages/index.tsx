import type { GetStaticProps, NextPage } from 'next'
import Head from 'next/head'
import { APP_NAME } from '../app'
import { Page } from '../components'

interface Props {
    pools: { id: number; name: string }[]
}

const Home: NextPage<Props> = ({ pools }) => {
    return (
        <Page>
            <Head>
                <title>{APP_NAME}</title>
                <meta
                    name="description"
                    content="" // TODO: Fix
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <ul>
                {pools.map((pool) => (
                    <li key={pool.id}>{pool.name}</li>
                ))}
            </ul>
        </Page>
    )
}

export const getStaticProps: GetStaticProps<Props> = async (context) => {
    await Promise.resolve() // TODO: Remove
    return {
        props: {
            pools: [{ id: 1, name: 'Test pool' }],
        },
    }
}

export default Home
