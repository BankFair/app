import { RiAlertFill } from 'react-icons/ri'
import { BsExclamationCircleFill } from 'react-icons/bs'
import {
    rgbRed,
    rgbTextPrimaryDark,
    rgbTextPrimaryLight,
    rgbYellow,
} from '../app'

export function Alert({
    style,
    title,
    body,
}: {
    style: 'warning' | 'critical'
    title: string
    body?: string
}) {
    const Icon = style === 'critical' ? BsExclamationCircleFill : RiAlertFill // warning

    return (
        <div className={`alert ${style}`}>
            <style jsx>{`
                .alert {
                    display: flex;
                    padding: 12px 16px;
                    border-radius: 8px;

                    &.warning {
                        color: ${rgbTextPrimaryLight};
                        background-color: ${rgbYellow};
                    }

                    &.critical {
                        color: ${rgbTextPrimaryDark};
                        background-color: ${rgbRed};
                    }
                }

                .text-container {
                    margin-left: 6px;

                    .title {
                        font-size: 16px;
                        font-weight: 400;
                        line-height: 24px;
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
