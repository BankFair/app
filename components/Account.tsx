import { Button } from './Button'
import { useActiveConnector } from '../app'
import { useDispatch } from 'react-redux'
import { clearLastConnectorName } from '../features/web3/web3Slice'

export function Account() {
    const dispatch = useDispatch()
    const connector = useActiveConnector()!

    return (
        <div>
            <style jsx>{`
                .box {
                    border: 1px solid grey;
                    border-radius: 6px;
                    max-width: 200px;
                    margin: 20px auto;
                    text-align: center;
                }
            `}</style>

            <div className="box">
                <h3>$0</h3>
                <h4>Lent</h4>
            </div>
            <div className="box">
                <h3>$0</h3>
                <h4>Projected Earning PA</h4>
            </div>
            <div className="box">
                <h3>0%</h3>
                <h4>Projected APY</h4>
            </div>
            <div className="box">
                <h3>0</h3>
                <h4>Pools Supported</h4>
            </div>

            <Button
                onClick={() => {
                    dispatch(clearLastConnectorName())
                    connector.deactivate()
                }}
                blue
                ghost
                style={{
                    margin: '0 auto',
                    width: 'max-content',
                    display: 'block',
                }}
            >
                Disconnect
            </Button>
        </div>
    )
}
