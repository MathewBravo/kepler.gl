#!/bin/bash

set -e 
set -o pipefail 

# Install Volta (Node & Yarn version manager)
if ! command -v volta &> /dev/null; then
    curl https://get.volta.sh | bash
    export PATH="$HOME/.volta/bin:$PATH"
fi

echo "Installing Node.js"
volta install node@18

echo "Installing Yarn"
volta install yarn@4.4.0

if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.nvm/nvm.sh
fi

nvm install
nvm use

corepack enable

yarn install
yarn bootstrap

yarn dlx puppeteer

yarn start
