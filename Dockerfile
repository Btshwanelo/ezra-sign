# Use an official Node.js runtime as a parent image
FROM node:24-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json into the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 3000
EXPOSE 4173

# Build the application
RUN npm run build

# Start the application
ENTRYPOINT sh -c "./dist/vite-envs.sh && npm run preview"
