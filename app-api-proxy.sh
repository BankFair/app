#!/bin/bash

npm i -g local-cors-proxy
npx local-cors-proxy --proxyUrl "https://test-borrower-api.sapling.finance" &
npx local-cors-proxy --proxyUrl "https://test-lender-api.sapling.finance" --port 8011 

