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
            },
            {
                name: 'Kitale Community Training Pool',
                address: '0x063527eeB60ba6E6240b898315cee9E637CABe13',
                block: 27974361,
            },
        ]),
    },
    basePath: buildingForGitHubPages ? '/app' : '',
    assetPrefix: buildingForGitHubPages ? '/app/' : '',
    reactStrictMode: true,
}
