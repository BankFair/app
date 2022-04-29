import { Button } from './Button'
import { useActiveConnector } from '../app'
import { useDispatch } from 'react-redux'
import { clearLastConnectorName } from '../features/web3/web3Slice'
import { ReactNode } from 'react'
import {
    BsBrightnessHighFill,
    BsFillClockFill,
    BsFillCheckCircleFill,
} from 'react-icons/bs'
import { FaHeart } from 'react-icons/fa'

export function Account() {
    const dispatch = useDispatch()
    const connector = useActiveConnector()!

    return (
        <>
            <style jsx>{`
                .stats {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                }
            `}</style>
            <div className="stats">
                <Stat value="$0" name="Lent" icon={<BsFillCheckCircleFill />} />
                <Stat
                    value="$0"
                    name="Projected Earning PA"
                    icon={<BsFillClockFill />}
                    color="blue"
                />
                <Stat
                    value="0%"
                    name="Projected APY"
                    icon={<BsBrightnessHighFill />}
                    color="yellow"
                />
                <Stat
                    value="0"
                    name="Pools Supported"
                    icon={<FaHeart />}
                    color="red"
                />
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
        </>
    )
}

function Stat({
    value,
    name,
    icon,
    color = 'green',
}: {
    value: string
    name: string
    icon: ReactNode
    color?: 'green' | 'blue' | 'yellow' | 'red'
}) {
    return (
        <>
            <style jsx>{`
                .container {
                    border-radius: 10px;
                    width: 250px;
                    height: 250px;
                    margin: 30px;
                    text-align: center;
                    padding-top: 40px;

                    > .icon {
                        border-radius: 50%;
                        margin: 0 auto 35px;
                        width: 64px;
                        height: 64px;
                        padding: 20px;
                        font-size: 24px;
                    }

                    > h3 {
                        margin: 0;
                        font-size: 32px;
                        font-weight: 500;
                    }

                    > .name {
                        margin-top: 12px;
                        font-size: 14px;
                    }

                    &.green {
                        background-color: #c8facd;
                        color: #0b5248;

                        > .icon {
                            background-image: linear-gradient(
                                315deg,
                                #a0e1b5 0%,
                                rgba(0, 0, 0, 0) 100%
                            );
                            color: #117b56;
                        }
                    }

                    &.blue {
                        background-color: #d0f2ff;
                        color: #14297b;

                        > .icon {
                            background-image: linear-gradient(
                                315deg,
                                #aaddff 0%,
                                rgba(0, 0, 0, 0) 100%
                            );
                            color: #3790ff;
                        }
                    }

                    &.yellow {
                        background-color: #fdf7cd;
                        color: #7a4f01;

                        > .icon {
                            background-image: linear-gradient(
                                315deg,
                                #f1dfa5 0%,
                                rgba(0, 0, 0, 0) 100%
                            );
                            color: #b78105;
                        }
                    }

                    &.red {
                        background-color: #fee7d9;
                        color: #7a0c2e;

                        > .icon {
                            background-image: linear-gradient(
                                315deg,
                                #f0bdb6 0%,
                                rgba(0, 0, 0, 0) 100%
                            );
                            color: #b72137;
                        }
                    }
                }
            `}</style>

            <div className={`container ${color}`}>
                <div className="icon">{icon}</div>
                <h3>{value}</h3>
                <div className="name">{name}</div>
            </div>
        </>
    )
}
