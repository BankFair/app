import { ReactNode } from 'react'

export function Modal({ children }: { children: ReactNode }) {
    return (
        <div className="background">
            <style jsx>{`
                .background {
                    background-color: rgba(1, 1, 1, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 10;
                }

                .content {
                    max-width: 400px;
                    background-color: white;
                    padding: 10px;
                    margin: 10px;
                    border-radius: 10px;
                }
            `}</style>

            <div className="content">{children}</div>
        </div>
    )
}
