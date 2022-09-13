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
    style: 'warning' | 'warning-blue' | 'error'
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
                    display: inline-block;
                    padding: 12px 16px;
                    border-radius: 8px;

                    > svg {
                        flex-shrink: 0;
                    }

                    &.warning,
                    &.warning-blue {
                        color: #686868;

                        > svg {
                            color: #ff9431;
                        }
                    }

                    &.warning {
                        background-color: #fff4ea;
                    }

                    &.warning-blue {
                        background-color: #eaf8fb;
                    }

                    &.error {
                        color: ${rgbTextPrimaryDark};
                        background-color: ${rgbRed};
                    }
                }

                .text-container {
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
