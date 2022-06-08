import { rgbGreen } from '../app'

export function Tabs<T extends readonly string[]>({
    tabs,
    currentTab,
    setCurrentTab,
}: {
    tabs: T
    currentTab: string
    setCurrentTab(tab: T[number]): void
}) {
    return (
        <div className="tabs">
            <style jsx>{`
                .tabs {
                    display: flex;
                    font-size: 16px;
                    font-weight: 600;

                    > div {
                        position: relative;
                        color: var(--color);
                        cursor: pointer;
                        padding: 0 0 8px;
                        width: 100px;
                        text-align: center;
                        margin-right: 16px;

                        &.selected {
                            &:after {
                                content: '';
                                position: absolute;
                                bottom: 0;
                                left: 0;
                                width: 100%;
                                height: 4px;
                                border-radius: 2px;
                                background-color: var(--greenery);
                            }
                        }
                    }
                }
            `}</style>
            {tabs.map((tab) => (
                <div
                    tabIndex={0}
                    key={tab}
                    className={currentTab === tab ? 'selected' : ''}
                    onClick={() => setCurrentTab(tab)}
                >
                    {tab}
                </div>
            ))}
        </div>
    )
}
