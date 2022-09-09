import { Button } from './Button'
import {
    Color,
    COLOR_BLUE,
    COLOR_BLUE_DARKER,
    COLOR_GREEN_DARK,
    COLOR_GREEN_DARKER,
    COLOR_RED_DARK,
    COLOR_RED_DARKER,
    COLOR_YELLOW_DARK,
    COLOR_YELLOW_DARKER,
    formatCurrency,
    rgb,
    rgba,
    rgbBlueDarker,
    rgbBlueLighter,
    rgbGreen,
    rgbGreenDarker,
    rgbGreenLighter,
    rgbRedDarker,
    rgbRedLighter,
    rgbYellowDarker,
    rgbYellowLighter,
    USDT_DECIMALS,
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
import { useAccountStats } from '../features'
import { Skeleton } from './Skeleton'

const greenDarkerTransparent = rgba(COLOR_GREEN_DARKER, 0.6)
const blueDarkerTransparent = rgba(COLOR_BLUE_DARKER, 0.6)
const redDarkerTransparent = rgba(COLOR_RED_DARKER, 0.6)
const yellowDarkerTransparent = rgba(COLOR_YELLOW_DARKER, 0.6)

export function Account() {
    const dispatch = useDispatch()
    const connector = useActiveConnector()!

    const accountStats = useAccountStats()

    return (
        <>
            <style jsx>{`
                .stats {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;

                    > div {
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
            `}</style>
            <div className="stats">
                <div>
                    <Stat
                        value={
                            accountStats ? (
                                formatCurrency(
                                    accountStats.lent,
                                    USDT_DECIMALS,
                                    0,
                                )
                            ) : (
                                <Skeleton
                                    width={100}
                                    color={greenDarkerTransparent}
                                />
                            )
                        }
                        name="Lent"
                        icon={<BsFillCheckCircleFill />}
                        color="green"
                    />
                    <Stat
                        value={
                            accountStats ? (
                                formatCurrency(
                                    accountStats.earning,
                                    USDT_DECIMALS,
                                    0,
                                )
                            ) : (
                                <Skeleton
                                    width={80}
                                    color={blueDarkerTransparent}
                                />
                            )
                        }
                        name="Projected Earning PA"
                        icon={<BsFillClockFill />}
                        color="blue"
                    />
                </div>
                <div>
                    <Stat
                        value={
                            accountStats ? (
                                `${accountStats.apy}%`
                            ) : (
                                <Skeleton
                                    width={60}
                                    color={yellowDarkerTransparent}
                                />
                            )
                        }
                        name="Projected APY"
                        icon={<BsBrightnessHighFill />}
                        color="yellow"
                    />
                    <Stat
                        value={
                            accountStats ? (
                                `${accountStats.pools}`
                            ) : (
                                <Skeleton
                                    width={30}
                                    color={redDarkerTransparent}
                                />
                            )
                        }
                        name="Pools Supported"
                        icon={<FaHeart />}
                        color="red"
                    />
                </div>
            </div>

            <Button
                onClick={() => {
                    dispatch(clearLastConnectorName())
                    connector.deactivate()
                }}
                style={{
                    margin: '0 auto',
                    width: 'max-content',
                    display: 'block',
                }}
                stone
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
    color,
}: {
    value: ReactNode
    name: string
    icon: ReactNode
    color: 'green' | 'blue' | 'yellow' | 'red'
}) {
    return (
        <>
            <style jsx>{`
                .container {
                    border-radius: 6px;
                    width: 150px;
                    height: 150px;
                    margin: 6px;
                    text-align: center;
                    padding-top: 20px;

                    > .icon {
                        border-radius: 50%;
                        margin: 0 auto 20px;
                        width: 44px;
                        height: 44px;
                        padding: 12px;
                        font-size: 20px;
                    }

                    > h3 {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 500;
                    }

                    > .name {
                        margin-top: 10px;
                        font-size: 11px;
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

                @media screen and (min-width: 868px) {
                    .container {
                        border-radius: 10px;
                        width: 250px;
                        height: 250px;
                        margin: 12px;
                        padding-top: 40px;

                        > .icon {
                            margin: 0 auto 35px;
                            width: 64px;
                            height: 64px;
                            padding: 20px;
                            font-size: 24px;
                        }

                        > h3 {
                            font-size: 32px;
                        }

                        > .name {
                            margin-top: 12px;
                            font-size: 14px;
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
