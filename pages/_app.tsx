import '../app/globals.css'

import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import { store, connectors } from '../app'
import Navigation from '../features/navigation/Navigation'
import { SwitchNetworkModal } from '../components'
import { useFetchContractPropertiesOnce } from '../features/web3/contract'
import { useConnectEagerly } from '../features/web3/hooks'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <Setup />
            <Web3ReactProvider connectors={connectors}>
                <SwitchNetworkModal />
                <Navigation />
                <Component {...pageProps} />
            </Web3ReactProvider>
        </Provider>
    )
}

function Setup() {
    useFetchContractPropertiesOnce()
    useConnectEagerly()
    return null
}