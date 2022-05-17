import { Web3ReactProvider } from '@web3-react/core'
import { Provider } from 'react-redux'
import type { AppProps } from 'next/app'
import { connectors, rgbBlue, rgbTextPrimary } from '../app'
import { SwitchNetworkModal, Navigation } from '../components'
import { useFetchPoolsPropertiesOnce, useConnectEagerly } from '../features'
import { store } from '../store'

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
                        color: ${rgbTextPrimary};
                    }

                    a {
                        color: ${rgbBlue};
                        text-decoration: none;

                        &.primary {
                            color: ${rgbTextPrimary};

                            &:hover {
                                text-decoration: underline;
                            }
                        }
                    }

                    * {
                        box-sizing: border-box;
                    }

                    input {
                        font-size: 16px;
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
    useFetchPoolsPropertiesOnce()
    useConnectEagerly()
    return null
}
