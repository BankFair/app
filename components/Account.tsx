import { Button } from './Button'
import {
    Color,
    COLOR_BLUE,
    COLOR_GREEN_DARK,
    COLOR_RED_DARK,
    COLOR_YELLOW_DARK,
    rgb,
    rgbBlueDarker,
    rgbBlueLighter,
    rgbGreenDarker,
    rgbGreenLighter,
    rgbRedDarker,
    rgbRedLighter,
    rgbYellowDarker,
    rgbYellowLighter,
    useActiveConnector,
} from '../app'
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

const green: Color = COLOR_GREEN_DARK
const blue: Color = COLOR_BLUE
const yellow: Color = COLOR_YELLOW_DARK
const red: Color = COLOR_RED_DARK

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
                        background-color: ${rgbGreenLighter};
                        color: ${rgbGreenDarker};

                        > .icon {
                            background-image: ${gradient(green)};
                            color: ${rgb(green)};
                        }
                    }

                    &.blue {
                        background-color: ${rgbBlueLighter};
                        color: ${rgbBlueDarker};

                        > .icon {
                            background-image: ${gradient(blue)};
                            color: ${rgb(blue)};
                        }
                    }

                    &.yellow {
                        background-color: ${rgbYellowLighter};
                        color: ${rgbYellowDarker};

                        > .icon {
                            background-image: ${gradient(yellow)};
                            color: ${rgb(yellow)};
                        }
                    }

                    &.red {
                        background-color: ${rgbRedLighter};
                        color: ${rgbRedDarker};

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
