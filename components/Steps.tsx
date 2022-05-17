import { Fragment } from 'react'
import {
    disabledBackground,
    disabledContent,
    disabledContentOpaque,
    rgbGreen,
} from '../app'

export function Steps({
    currentStep,
    steps,
}: {
    currentStep: number
    steps: string[]
}) {
    return (
        <div className="steps">
            <style jsx>{`
                .steps {
                    display: flex;
                    padding: 0 10px;
                    width: 100%;
                    overflow-x: hidden;
                    z-index: 0;
                    position: relative;
                }

                .step {
                    width: 32px;
                    z-index: 1;

                    > .circle-background {
                        width: 100%;
                        height: 32px;
                        border-radius: 50%;

                        > .circle {
                            width: 100%;
                            height: 100%;
                            line-height: 32px;
                            font-size: 14px;
                            text-align: center;
                            color: white;
                            background-color: ${rgbGreen};
                            border-radius: 50%;
                        }
                    }

                    > .label {
                        margin-top: 8px;
                        text-align: center;
                        font-size: 14px;
                        margin-left: -100%;
                        margin-right: -100%;
                    }

                    &.disabled {
                        > .circle-background {
                            background-color: white;

                            > .circle {
                                color: ${disabledContentOpaque};
                                background-color: ${disabledBackground};
                            }
                        }

                        > .label {
                            color: ${disabledContent};
                        }
                    }
                }

                .line {
                    flex-grow: 1;
                    z-index: 0;
                    height: 4px;
                    background-color: ${rgbGreen};
                    margin: 14px -10px 0;

                    &.disabled {
                        background-color: ${disabledBackground};
                    }
                }
            `}</style>
            {steps.map((step, index) => {
                return (
                    <Fragment key={index}>
                        <div
                            className={`step ${
                                index >= currentStep ? 'disabled' : ''
                            }`}
                        >
                            <div className="circle-background">
                                <div className="circle">{index + 1}</div>
                            </div>

                            <div className="label">{step}</div>
                        </div>
                        {index === steps.length - 1 ? null : (
                            <div
                                className={`line ${
                                    index >= currentStep - 1 ? 'disabled' : ''
                                }`}
                            />
                        )}
                    </Fragment>
                )
            })}
        </div>
    )
}
