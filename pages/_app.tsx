import '../app/globals.css'

import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import { store, connectors, getLastConnector } from '../app'
import Navigation from '../features/navigation/Navigation'
import { SwitchNetworkModal } from '../components'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        if (typeof window === 'object') {
            const connector = getLastConnector()
            if (connector) {
                connector.connectEagerly
                    ? connector.connectEagerly()
                    : connector.activate()
            }
        }
    }, [])
    return (
        <Provider store={store}>
            <Web3ReactProvider connectors={connectors}>
                <SwitchNetworkModal />
                <Navigation />
                <Component {...pageProps} />
            </Web3ReactProvider>
        </Provider>
    )
}
