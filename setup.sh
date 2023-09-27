if [ ! -f ".env" ]; then
    echo "Starting setup..."
    echo "Generating IPFS swarm key..."
    GENERATED_KEY=$(docker run --rm -it mattjtodd/ipfs-swarm-key-gen | tail -n 1)

    echo "Copying environment variables"
    cp .env.example .env

    echo "Setting swarm key"
    sed -i "s/IPFS_SWARM_KEY=/IPFS_SWARM_KEY=$GENERATED_KEY/" .env

fi
echo "Setup complete (delete .env and run again to redo setup)"