import { prefix } from '../app'
import { Box } from './Box'
import { PoolDescription } from './PoolDescription'

export function PoolInfo({
    poolAddress,
    name,
    description,
}: {
    poolAddress: string
    name: string
    description: string
}) {
    return (
        <Box>
            <style jsx>{`
                h2 {
                    font-size: 24px;
                    margin: 0 0 16px;
                }

                .subtitle {
                    color: var(--color-secondary);
                    font-size: 16px;
                    font-weight: 400;
                    margin: 24px 0 0;
                    display: flex;
                    align-items: center;

                    > img {
                        width: 24px;
                        height: 24px;
                        margin-right: 8px;
                    }
                }
            `}</style>
            <h2>{name}</h2>
            {description && <PoolDescription text={description} />}
            <div className="subtitle">
                <img src={`${prefix}/usdc.svg`} alt="USDC logo" />
                USDC
            </div>
        </Box>
    )
}
