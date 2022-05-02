import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import { store, connectors, COLOR_BLUE } from '../app'
import Navigation from '../features/navigation/Navigation'
import { SwitchNetworkModal } from '../components'
import { useFetchContractPropertiesOnce } from '../features/web3/contract'
import { useConnectEagerly } from '../features/web3/hooks'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <Provider store={store}>
            <Setup />
            <Web3ReactProvider connectors={connectors}>
                <style jsx global>{`
                    html,
                    body {
                        padding: 0;
                        margin: 0;
                        font-family: -apple-system, BlinkMacSystemFont, Segoe UI,
                            Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans,
                            Droid Sans, Helvetica Neue, sans-serif;
                        font-weight: 300;
                    }

                    a {
                        color: ${COLOR_BLUE};
                        text-decoration: none;
                    }

                    * {
                        box-sizing: border-box;
                    }
                `}</style>
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
