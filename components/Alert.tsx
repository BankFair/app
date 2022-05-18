import { RiAlertFill } from 'react-icons/ri'
import { rgbTextPrimaryDark, rgbYellow } from '../app'

export function Alert({
    style,
    title,
    body,
}: {
    style: 'warning'
    title: string
    body?: string
}) {
    return (
        <div className={`alert ${style}`}>
            <style jsx>{`
                .alert {
                    display: flex;
                    padding: 12px 16px;
                    border-radius: 8px;

                    &.warning {
                        color: ${rgbTextPrimaryDark};
                        background-color: ${rgbYellow};
                    }
                }

                .text-container {
                    margin-left: 4px;

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

            <RiAlertFill size={24} />

            <div className="text-container">
                <div className="title">{title}</div>
                <div className="body">{body}</div>
            </div>
        </div>
    )
}
