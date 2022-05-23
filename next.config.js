/** @type {import('next').NextConfig} */

const buildingForGitHubPages = Boolean(process.env.BUILDING_FOR_GITHUB_PAGES)

module.exports = {
    env: {
        BUILDING_FOR_GITHUB_PAGES: process.env.BUILDING_FOR_GITHUB_PAGES,
        POOLS: JSON.stringify([
            {
                name: 'Test Pool #1',
                address: '0xB7C871b52d127b5c8354AC5E90Eb108DA673A040',
            },
            {
                name: 'Test Pool #2',
                address: '0x9dAa37385F0DA29c742b4a248740bd86a240E853',
            },
        ]),
    },
    basePath: buildingForGitHubPages ? '/app' : '',
    assetPrefix: buildingForGitHubPages ? '/app/' : '',
    reactStrictMode: true,
}
