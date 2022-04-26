#!/bin/bash

YARN_FOLDER=".yarn/releases"
YARN_PATH="$YARN_FOLDER/yarn.cjs"
YARN_HASH="cf001cdd6097c1437ffe10734bc99043551d0f2f"

if echo "$YARN_HASH  $YARN_PATH" | shasum --check; then
    exit 0
fi

mkdir -p $YARN_FOLDER
curl https://repo.yarnpkg.com/3.2.0/packages/yarnpkg-cli/bin/yarn.js --output $YARN_PATH

if echo "$YARN_HASH  $YARN_PATH" | shasum --check; then
    exit 0
else
    exit 1
fi
