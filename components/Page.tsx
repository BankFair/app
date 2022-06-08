import { ReactNode } from 'react'

export function Page({ children, xl }: { children: ReactNode; xl?: boolean }) {
    return (
        <div className={`page ${xl ? 'xl' : ''}`}>
            <style jsx>{`
                .page {
                    width: 100%;
                    max-width: 800px;
                    margin: 32px 0;
                    padding: 0 32px;

                    &.xl {
                        max-width: 1200px;
                    }

                    > :global(h1):first-child {
                        margin-top: 0;
                        font-size: 36px;
                    }
                }
            `}</style>
            {children}
        </div>
    )
}
