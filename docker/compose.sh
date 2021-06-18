#!/bin/bash

composeFilePath=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

if [ "$DEV" != "" ]; then
  dockerFiles="-f $composeFilePath/docker-compose.yml -f $composeFilePath/docker-compose-dev-proxy.yml"
  configHost="${DEV//./-}.my.local-ip.co"
else
  dockerFiles="-f $composeFilePath/docker-compose.yml -f $composeFilePath/docker-compose-prod-proxy.yml"
  configHost="cop.app.medicmobile.org"
fi

if [ "$1" == "init" ]; then

    echo ""
    echo "Initializing $configHost"
    echo ""

    docker volume create --name=instant
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml up -d

    # Set up the replica set
    "$composeFilePath"/initiateReplicaSet.sh

    docker-compose -p instant $dockerFiles up -d

    echo ""
    echo "Initializing OpenHIM and configuring hostname"
    echo ""
    sleep 5
    curl -k -X POST -H "Content-Type: application/json"  -d @./importer/volume/openhim-import.json -k --user root\@openhim.org:openhim-password https://${configHost}:8080/metadata

    docker exec -it openhim-console sh -c "sed -i 's/localhost/$configHost/g' config/default.json"

    if [ "$DEV" != "" ]; then
      ./refresh-local-ip-certs.sh
    fi

    echo ""
    echo "Initialization complete!"
    echo ""
    echo "    OpenHIM Admin Console: https://$configHost:9001"
    echo "    OpenHIM API: https://$configHost:8080"
    echo "    OpenHIM Client Endpoint: https://$configHost:5002"
    echo ""

elif [ "$1" == "up" ]; then

    echo ""
    echo "Starting $configHost"
    echo ""

    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml up -d

    # Wait for mongo replica set to be set up
    sleep 20

    docker-compose -p instant $dockerFiles up -d

    echo ""
    echo "Startup complete!"
    echo ""
    echo "    OpenHIM Admin Console: https://$configHost:9001"
    echo "    OpenHIM API: https://$configHost:8080"
    echo "    OpenHIM Client Endpoint: https://$configHost:5002"
    echo ""

elif [ "$1" == "down" ]; then
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml $dockerFiles stop
elif [ "$1" == "destroy" ]; then
    docker-compose -p instant -f "$composeFilePath"/docker-compose-mongo.yml $dockerFiles down -v
    docker volume rm instant
else
    echo "Valid options are: init, up, down, or destroy"
fi

