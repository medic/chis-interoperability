#!/bin/bash

if ! command -v docker&> /dev/null
then
  echo ""
  echo "Docker is not installed or could not be found.  Please check your installation."
  echo ""
  exit
fi

if [ "$( docker container inspect -f '{{.State.Status}}' 'nginx-proxy' )" == "running" ]; then
  echo ""
  echo "Updating local-ip.co certficates on nginx-proxy container..."
  docker exec -it nginx-proxy bash -c "curl -s -o server.pem http://local-ip.co/cert/server.pem"
  docker exec -it nginx-proxy bash -c "curl -s -o chain.pem http://local-ip.co/cert/chain.pem"
  docker exec -it nginx-proxy bash -c "cat server.pem chain.pem > /etc/local-ip-certs/default.crt"
  docker exec -it nginx-proxy bash -c "curl -s -o /etc/local-ip-certs/default.key http://local-ip.co/cert/server.key"
  echo ""
  echo "Restarting nginx-proxy container..."
  docker restart nginx-proxy
  echo ""
  echo "Certificate update complete!"
else
  echo ""
  echo "'nginx-proxy' docker container is not running. Please start it and try again."
  echo "See this URL for more information:"
  echo ""
  echo "    https://github.com/medic/chis-interoperability/"
  echo ""
fi

