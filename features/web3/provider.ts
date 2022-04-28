import { providers } from 'ethers'
import { RPC_URL } from '../../app'

const provider = new providers.JsonRpcBatchProvider(RPC_URL)

export default provider
