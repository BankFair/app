/** @type {import('next').NextConfig} */

const buildingForGitHubPages = Boolean(process.env.BUILDING_FOR_GITHUB_PAGES)

module.exports = {
    env: {
        BUILDING_FOR_GITHUB_PAGES: process.env.BUILDING_FOR_GITHUB_PAGES,
        POOLS: JSON.stringify([
            {
                name: 'Kitale Community Pool (Uganda)',
                address: '0xf98d1a7cf433870fF3b7f9471fB5320F9CDc2003',
                description: 'The Kitale Community Pool lends to businesses in the Kitale area in Uganda. The most promising businesses are chosen based on the commercial outcome and the impact the growing business will have on job creation. The Pool Manager has been making loans for the last 10 years with zero default. Local businesses are chosen based on sustainability, the history of the business owner, and financially sound. The Pool Manager takes security and personal guarantees from the business owners. The security taken by the Pool Manager is normally the deed of their property. The Pool Manager aims to grow their stake in the pool and thus keep growing the pool. Some of the Pool Manager profits will be used as a contribution to the running costs of the Kitale Community School. In very few cases our borrowers can\'t access loans through local banks and if they can, the rates offered are significantly higher than the rates they can get through this lending pool.',
            },
            {
                name: 'African Women Entrepreneurs',
                address: '0xd08cDeD2A70da00cB38718dbabB5A0DDe7EFD128',
                description: 'We lend to amazing women Entrepreneurs in Africa. Women are clear entrepreneurial leaders in sub-Saharan Africa but less than 8% of $4.3 billion in funding raised by African entrepreneurs in 2021 went to women-led founding teams. We\'re here to help fix this gender gap. Out of need, entrepreneurship is more common among African women than men. Africa leads in the percentage of women entrepreneurs compared to any other place in the world. However, women-led businesses are, on average, smaller and less likely to be supported by outside investment than businesses led by men. There is not a gender gap in African entrepreneurship. There is a gender gap in African scaling. The businesses we lend to have been trading for at least 3 years, are cashflow positive, have 3 external references, give personal guarantees and provide collateral in terms of security on assets or future cash flows. We also filter to choose long-term sustainable and viable businesses such as farming, manufacturing, logistics and technology. Most have grown each year, the entrepreneur has great levels of English and the business has a good history of credit. This pool is new but we expect limited or zero defaults.',
            },
            {
                name: 'Kenya Farming Pool',
                address: '0x24C78BE8163cA7b8630A86786Ec1b51df9F763d5',
                description: 'We lend to the best farming entrepreneurs in Kenya. Using cutting-edge technology and finance we help small-scale farmers scale up. We lend to fast-growing farmers that we source using satellite technology and we helping them grow with debt finance. Our support isn\'t just finance, we support via, farm inputs, advice, insurance, and market access, when possible. Our farmers have been in business for at least 4 years, are cash flow positive, and give security on land.',
            },
            {
                name: 'South Africa Women Growth Pool',
                address: '0x341726455dCFBF4065b58635535b19Ce24eF71d9',
                description: 'For the last 20 years, we have been giving micro-loans to South African women. Our mission is poverty alleviation in South Africa. This mission is primarily through the provision of enterprise micro credit to women living in poor, rural communities. Many borrowers have outgrown microfinance and need a stage for scale lending, internationally. Thus our borrowers in this pool have outgrown our current lending offerings as our off chain loan amounts are small. In this pool we lend to our business women that have graduated from our microfinance and need a larger loan to build their business to the next level. Our pool also helps highlight their success and allows them to build a public credit history on the blockchain, which in turn will help them access larger, and most affordable finance in the future. We would love you to help us back our most promising women. We have worked with all the borrowers in this pool for over 10 years, we take security where possible and personal guarantees. All businesses have proven to be long-term viable and cash generative. Business types include manufacturing, technology, wholesale, construction and farming.',
            },
            {
                name: 'Norfolk Growth Entrepreneurs Lending Pool',
                address: '0x601C2A080518aA823371F070Dca4Ef2Ee65fD800',
                description: 'Supporting best the best up and coming business in Norfolk that will grow the economy, provide jobs and train up the workforce. We only lend to profitable, sustainable, well run businesses. All businesses are at least 3 years old, are cash flow positive and have personal guarantees from the owners. Business types normally are recurring revenue and stable businesses such as SAAS, marketplaces, IT services companies, agencies (with years of track record).',
            },
            {
                name: 'Test Pool v0.5.0',
                address: '0xB2E690B4B8BdBA1573E5a02DC7D1570bF2B7E9A0',
                description: '',
            },
        ]),
    },
    basePath: buildingForGitHubPages ? '/app' : '',
    assetPrefix: buildingForGitHubPages ? '/app/' : '',
    reactStrictMode: true,
}
