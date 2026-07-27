#!/bin/bash

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# List of folders to copy into
folders=(
    "srcs/chat-service"
    "srcs/duplicati"
    "srcs/game-service"
    "srcs/gateway"
    "srcs/user-service"
    "srcs/log-service"
)

# Copy .env into each folder
for folder in "${folders[@]}"; do
    echo "Copying .env to $folder/ ..."
    cp -rf .env "$folder/"
done

rm -rf ./.env

echo "Done!"