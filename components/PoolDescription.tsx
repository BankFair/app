import { useState } from 'react'

export function PoolDescription() {
    const [showMore, setShowMore] = useState(false)
    return (
        <div>
            <style jsx>{`
                .text {
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 23.04px;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    text-overflow: ellipsis;

                    &.more {
                        -webkit-line-clamp: initial;
                    }
                }

                a {
                    margin-top: 8px;
                    color: var(--greenery);
                    font-weight: 600;
                    font-size: 16px;
                    line-height: 19px;
                    display: inline-block;
                    cursor: pointer;
                }
            `}</style>
            <div className={`text ${showMore ? 'more' : ''}`}>
                In the eighteenth century the German philosopher Immanuel Kant
                developed a theory of knowledge in which knowledge about space
                can be both a priori and synthetic. According to Kant, knowledge
                about space is synthetic, in that statements about space are not
                simply true by virtue of the meaning of the words in the
                statement. In his work, Kant rejected the view that space must
                be either a substance or relation. Instead he came to the
                conclusion that space and time are not discovered by humans to
                be objective features of the world, but imposed by us as part of
                a framework for organizing experience.
            </div>
            <a onClick={() => setShowMore(!showMore)}>
                {showMore ? 'Show less' : 'Show more'}
            </a>
        </div>
    )
}
