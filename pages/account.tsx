import type { NextPage } from 'next'
import Head from 'next/head'
import { useActiveConnector, APP_NAME } from '../app'
import { Connect, Account, Page } from '../components'

const AccountPage: NextPage = () => {
    const activeConnector = useActiveConnector()

    const title = `${
        activeConnector ? 'Connect wallet' : 'Account'
    } - ${APP_NAME}`

    return (
        <Page>
            <Head>
                <title>{title}</title>
                <meta
                    name="description"
                    content="Connect your Ethereum wallet"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            {activeConnector ? <Account /> : <Connect />}
        </Page>
    )
}

export default AccountPage
