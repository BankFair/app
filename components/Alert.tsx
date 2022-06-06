import { AiFillInfoCircle } from 'react-icons/ai'
import { RiAlertLine } from 'react-icons/ri'
import { BsExclamationCircleFill } from 'react-icons/bs'
import {
    COLOR_BLUE_LIGHTER,
    rgba,
    rgbBlue,
    rgbBlueDarker,
    rgbBlueLight,
    rgbBlueLighter,
    rgbRed,
    rgbTextPrimaryDark,
    rgbTextPrimaryLight,
    rgbYellow,
    rgbYellowDarker,
    rgbYellowLighter,
} from '../app'

export function Alert({
    style,
    title,
    body,
}: {
    style:
        | 'warning-filled'
        | 'warning'
        | 'error-filled'
        | 'info'
        | 'info-outlined'
    title: string
    body?: string
}) {
    const Icon = style.startsWith('warning')
        ? RiAlertLine
        : style.startsWith('info')
        ? AiFillInfoCircle
        : BsExclamationCircleFill // error

    return (
        <div className={`alert ${style}`}>
            <style jsx>{`
                .alert {
                    display: flex;
                    padding: 12px 16px;
                    border-radius: 8px;

                    > svg {
                        flex-shrink: 0;
                    }

                    &.warning {
                        color: ${rgbYellowDarker};
                        background-color: ${rgbYellowLighter};

                        > svg {
                            color: ${rgbYellow};
                        }
                    }

                    &.warning-filled {
                        color: ${rgbTextPrimaryLight};
                        background-color: ${rgbYellow};
                    }

                    &.error-filled {
                        color: ${rgbTextPrimaryDark};
                        background-color: ${rgbRed};
                    }

                    &.info {
                        color: ${rgbBlueDarker};
                        background-color: ${rgbBlueLighter};

                        > svg {
                            color: ${rgbBlue};
                        }
                    }

                    &.info-outlined {
                        color: ${rgbBlueDarker};
                        background-color: ${rgba(COLOR_BLUE_LIGHTER, 0.48)};
                        border: 1px solid ${rgbBlueLight};
                        padding: 10px 14px;

                        > svg {
                            color: ${rgbBlue};
                        }
                    }
                }

                .text-container {
                    margin-left: 6px;
                    align-self: center;

                    .title {
                        font-size: 15px;
                        font-weight: 400;
                        line-height: 19px;
                    }
                    .body {
                        font-size: 14px;
                    }
                }
            `}</style>

            <Icon size={24} />

            <div className="text-container">
                <div className="title">{title}</div>
                <div className="body">{body}</div>
            </div>
        </div>
    )
}
