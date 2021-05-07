#!/bin/bash

composeFilePath=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

if [ "$1" == "init" ]; then
    docker volume create --name=instant
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml up -d

    # Set up the replica set
    "$composeFilePath"/initiateReplicaSet.sh

    docker-compose -p instant -f "$composeFilePath"/docker-compose.yml  up -d

    sleep 4
    echo ""
    echo "Initializing OpenHIM and configuring hostname"
    echo ""
    sleep 1
    curl -k -X POST -H "Content-Type: application/json"  -d @./importer/volume/openhim-import.json -k --user root\@openhim.org:openhim-password https://cop.app.medicmobile.org:8080/metadata

    docker exec -it openhim-console sh -c "sed -i 's/localhost/cop.app.medicmobile.org/g' config/default.json"

elif [ "$1" == "up" ]; then
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml up -d

    # Wait for mongo replica set to be set up
    sleep 20

    docker-compose -p instant -f "$composeFilePath"/docker-compose.yml up -d
elif [ "$1" == "down" ]; then
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml -f "$composeFilePath"/docker-compose.yml -f "$composeFilePath"/docker-compose.dev.yml -f "$composeFilePath"/importer/docker-compose.config.yml stop
elif [ "$1" == "destroy" ]; then
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml -f "$composeFilePath"/docker-compose.yml -f "$composeFilePath"/docker-compose.dev.yml -f "$composeFilePath"/importer/docker-compose.config.yml down -v
else
    echo "Valid options are: init, up, down, or destroy"
fi
