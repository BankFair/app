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
                    justify-content: space-evenly;
                    height: 30px;
                    font-size: 14px;

                    > div {
                        position: relative;
                        color: var(--color-secondary);
                        line-height: 30px;
                        cursor: pointer;

                        &.selected {
                            color: var(--color);

                            &:after {
                                content: '';
                                position: absolute;
                                bottom: 0;
                                left: 0;
                                width: 100%;
                                height: 2px;
                                border-radius: 1px;
                                background-color: ${rgbGreen};
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
