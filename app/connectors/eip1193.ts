import { initializeConnector } from '@web3-react/core'
import { EIP1193 } from '@web3-react/eip1193'

const mockProvider = {
    isMockProvider: true,
    on() {},
    request() {},
}

const provider =
    (typeof window === 'object' ? (window as any).ethereum : undefined) ||
    mockProvider

export const [eip1193, hooks] = initializeConnector<EIP1193>(
    (actions) => new EIP1193(actions, provider),
)
