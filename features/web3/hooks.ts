import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectLastConnector } from './web3Slice'

export function useConnectEagerly() {
    const ref = useRef(false)
    const lastConnector = useSelector(selectLastConnector)

    useEffect(() => {
        if (typeof window !== 'object' || ref.current) return
        // https://github.com/reactwg/react-18/discussions/18
        // Read "Effects that should only run once can use a ref"
        ref.current = true

        if (lastConnector) {
            lastConnector.connectEagerly
                ? lastConnector.connectEagerly()
                : lastConnector.activate()
        }
    }, [lastConnector])
}
