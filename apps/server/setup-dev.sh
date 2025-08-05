#!/bin/bash
set -e

echo "Installing Termux dependencies..."
pkg update && pkg upgrade -y
pkg install nodejs git openssh clang -y

echo "Installing global npm tools..."
npm install -g typescript eslint prettier ts-node

echo "Setting up SSH keys..."
if [ ! -f ~/.ssh/id_ed25519 ]; then
  read -p "Enter email for SSH key: " email
  ssh-keygen -t ed25519 -C "$email" -f ~/.ssh/id_ed25519
  echo "Your public key is:"
  cat ~/.ssh/id_ed25519.pub
  echo "Add it to GitHub: https://github.com/settings/keys"
fi

echo "Installing project dependencies..."
cd "$(dirname "$0")"
npm ci

echo "Setting up Husky..."
npx husky install

echo "Done! Run 'npm run dev' to start the server."
