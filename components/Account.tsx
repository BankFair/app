import { Button } from './Button'
import { Color, rgb, useActiveConnector } from '../app'
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

const green: Color = {
    r: 0,
    g: 123,
    b: 85,
}

const blue: Color = {
    r: 24,
    g: 144,
    b: 255,
}

const yellow: Color = {
    r: 183,
    g: 129,
    b: 3,
}

const red: Color = {
    r: 189,
    g: 58,
    b: 76,
}

const gradient = (color: Color) =>
    `linear-gradient(315deg, rgb(${color.r},${color.g},${color.b}) -200%, rgba(${color.r},${color.g},${color.b},0) 100%)`

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
                    margin: 12px;
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
                        opacity: 0.72;
                    }

                    &.green {
                        background-color: #c8facd;
                        color: #005249;

                        > .icon {
                            background-image: ${gradient(green)};
                            color: ${rgb(green)};
                        }
                    }

                    &.blue {
                        background-color: #d0f2ff;
                        color: #04297a;

                        > .icon {
                            background-image: ${gradient(blue)};
                            color: ${rgb(blue)};
                        }
                    }

                    &.yellow {
                        background-color: #fff7cd;
                        color: #7a4f01;

                        > .icon {
                            background-image: ${gradient(yellow)};
                            color: ${rgb(yellow)};
                        }
                    }

                    &.red {
                        background-color: #ffe7d9;
                        color: #7a0c2e;

                        > .icon {
                            background-image: ${gradient(red)};
                            color: ${rgb(red)};
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
