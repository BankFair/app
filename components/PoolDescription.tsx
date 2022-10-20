import { useEffect, useState } from 'react'

const kitaleDescription = (
    <>
        <p>
            The Kitale Community Pool lends to small businesses in the Kitale
            area of Uganda.
        </p>
        <p>
            The Pool Manager, Mr Ausicery Jean, has been lending successfully in
            his local community for over 8 years to help fund the Kitale
            Community School. He has an outstanding track record, experiencing
            zero defaults to date. The Pool Manager’s approach is facilitated by
            four key principles: (1) collateral taken for every loan, (2)
            affordable rates for borrowers, (3) clear and understandable
            business cases from each borrower, and (4) familiarity with
            borrowers based on long-term relationships.
        </p>
        <p>
            Prospective borrowers in the Kitale region have difficulty accessing
            capital from banks and microfinance firms. In the very few cases
            that these borrowers can access loans from banks, predominantly
            based in towns and cities far removed from the Kitale community, the
            rates offered are significantly higher than the rates available from
            the Kitale Community Pool. The aim of the pool is therefore to offer
            more affordable rates than available elsewhere in the region,
            meaning that the end borrower can retain and reinvest a greater
            amount of profit generated from their business.
        </p>
        <p>
            The Pool Manager selects the most promising businesses in the Kitale
            community based on their growth potential and their ability to
            facilitate job creation in the local area. Businesses selected to
            receive loans will have sound financial fundamentals, have
            demonstrated long term, sustainable performance or will be owned or
            managed by individuals with a strong commercial track record. The
            Pool Manager takes security and personal guarantees from the
            business owners, with the security normally comprising the deed of
            the business owner’s property.
        </p>
        <p>
            A significant proportion of loans issued by the Kitale Community
            Pool will be to agricultural businesses that require finance to
            irrigate, fertilise and insure their crops. Any loans to
            agricultural businesses will be issued with crop insurance if not
            already in place, so that in the event of a crop failure the
            outstanding debt will be repaid via the insurance policy.
        </p>
        <p>
            A proportion of the Pool Manager profits will be used to contribute
            to the running costs of the Kitale Community School.
        </p>
    </>
)

const ikiIkiPoolDescription = (
    <>
        <p>
            The Iki-Iki Farmers Pool lends to a co-operative of over 40 farmers from
            around the town of Iki-Iki in the Budaka region of Eastern Uganda, 20km
            from the city of Mbale. Budaka&apos;s economy is dominated by agriculture with
            the majority of farming activities undertaken by small holders who produce
            perennial and annual crops such as bananas, coffee, cotton, maize, sweet
            potatoes, tomatoes, beans, cassava and groundnuts.
        </p>

        <p>
            The farming cooperative that will benefit from the loans made from Iki-Iki
            Farmers Pool has been working together successfully for a number of years,
            pooling savings and harvests whilst benefiting from collective training and
            buying power. The Pool Manager will be Regina, who has led the Iki-Iki
            Farmers collective for a number of years, and will be responsible for
            distributing loans and collecting repayments from members of the cooperative.
        </p>

        <p>
            Loans will be used to facilitate the growing of higher yield crops such as tomatoes.
            A pre-condition of the Pool issuing a loan will be that the farmer in question has
            purchased crop insurance or will use part of the loan to purchase crop insurance.
            By enabling the cooperative members to purchase crop insurance policies, Pool loans
            will allow the farmers to protect themselves against the downside risk of crop failure
            (the higher yield crops in question have a higher failure rate) whilst benefiting
            from the material upside of successful harvests.
        </p>

        <p>
            The Pool Manager&apos;s risk management approach is facilitated by three key principles:
            (1) crop insurance as a pre-requisite of loan issuance, (2) affordable rates for borrowers
            and (3) familiarity with borrowers based on long-term relationships.
        </p>

        <p>
            Prospective borrowers within the cooperative currently have difficulty accessing capital
            from banks and microfinance firms. The aim of the pool is therefore to increase financial
            inclusion in the area, generate higher crop yields and offer more affordable rates than
            available elsewhere in the region, meaning that the end borrower can retain and reinvest
            a greater amount of profit generated from their business.
        </p>
 </>
)

const descriptions: Record<string, JSX.Element> = {
    '0xA3e07757131E5587ebB58ABB08de10783FC090Be': kitaleDescription,
    '0x32e32bbEf75dc75FA09326B64799CDc5CB831a19': kitaleDescription,
    '0x70527768dB88924985460fCada217E2AEDb9a620': ikiIkiPoolDescription,
    '0x063527eeB60ba6E6240b898315cee9E637CABe13': <>Training Pool</>,
    '0x24c6ec0283EbCe4703f4667880Dd8b048e48e850': <>Training Pool for user training under live network conditions</>
}

let nextMountShowMoreState = false
export function PoolDescription({
    address,
    showMoreInNextMount,
}: {
    address: string
    showMoreInNextMount?: boolean
}) {
    const [showMore, setShowMore] = useState(nextMountShowMoreState)

    useEffect(() => {
        nextMountShowMoreState = false
    }, [])

    const description = descriptions[address]
    if (!description) return null

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

                        > :global(p) {
                            display: block;

                            &::after {
                                content: '';
                            }
                        }
                    }

                    > :global(p) {
                        display: inline;
                        margin-top: 0;

                        &::after {
                            content: ' ';
                        }

                        &:last-child {
                            margin-bottom: 0;
                        }
                    }
                }

                span {
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
                {description}
            </div>
            <span
                onClick={(event) => {
                    if (showMoreInNextMount) {
                        nextMountShowMoreState = true
                    } else {
                        event.stopPropagation()
                        event.preventDefault()
                        setShowMore(!showMore)
                    }
                }}
            >
                {showMoreInNextMount
                    ? 'Go to pool to read more'
                    : showMore
                    ? 'Show less'
                    : 'Show more'}
            </span>
        </div>
    )
}
