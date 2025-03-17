# Use an official Node.js image as a base
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package*.json ./

# Install dependencies
RUN npm install -g hardhat npm-run-all
RUN npm install

# Copy the entire project
COPY . .

# Expose necessary ports (8545 for Hardhat, 3000 for the API server)
EXPOSE 8545 3000

# Use a script to start both Hardhat and the server
CMD ["sh", "./start.sh"]
