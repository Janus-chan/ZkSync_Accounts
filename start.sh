#!/bin/sh

# Start Hardhat node in the background
npx hardhat node &

# Start the Node.js server
node api.js
