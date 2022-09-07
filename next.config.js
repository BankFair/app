/** @type {import('next').NextConfig} */

const buildingForGitHubPages = Boolean(process.env.BUILDING_FOR_GITHUB_PAGES)

module.exports = {
    env: {
        BUILDING_FOR_GITHUB_PAGES: process.env.BUILDING_FOR_GITHUB_PAGES,
        POOLS: JSON.stringify([
            {
                name: 'Kitale Community Pool (Uganda)',
                address: '0x32e32bbEf75dc75FA09326B64799CDc5CB831a19',
                block: 27778687,
                description:
                    "The Kitale Community Pool lends to businesses in the Kitale area in Uganda. The most promising businesses are chosen based on the commercial outcome and the impact the growing business will have on job creation. The Pool Manager has been making loans for the last 10 years with zero default. Local businesses are chosen based on sustainability, the history of the business owner, and financially sound. The Pool Manager takes security and personal guarantees from the business owners. The security taken by the Pool Manager is normally the deed of their property. The Pool Manager aims to grow their stake in the pool and thus keep growing the pool. Some of the Pool Manager profits will be used as a contribution to the running costs of the Kitale Community School. In very few cases our borrowers can't access loans through local banks and if they can, the rates offered are significantly higher than the rates they can get through this lending pool.",
            },
            {
                name: 'Kitale Community Training Pool',
                address: '0x063527eeB60ba6E6240b898315cee9E637CABe13',
                block: 27974361,
                description:
                    "Training Pool",
            },
        ]),
    },
    basePath: buildingForGitHubPages ? '/app' : '',
    assetPrefix: buildingForGitHubPages ? '/app/' : '',
    reactStrictMode: true,
}
