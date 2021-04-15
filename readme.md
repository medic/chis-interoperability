# Infrastructure for Community of Practice (CoP) Interoperability Project

## Overview 

TBD

## Install

These steps use the OpenHIE Instante repo using the [docker-compose steps](https://github.com/openhie/instant#docker-compose). Start by becoming `root` and `cd`ing into the `/srv/chis/` directory.

Follow either First time Install or Re-install steps:

### First time Install

1. Check out the repo `git clone https://github.com/openhie/instant.git`
1. `cd` into the newly created `./instant` directory
1. Go onto Shared install instructions steps below

### Re-install

1. `cd` into the existing `./instant` directory
1. If you're re-installing, refresh the git repo: `git pull origin`
1. Stop the containers with `yarn docker:instant down -t docker`
1. Double check no containers are running with `docker ps`
1. Remove all project components `yarn docker:instant destroy -t docker`
1. To be EXTRA thorough, remove any named containers (i.e. ones without a hash as a name) found via `docker volume ls`.
 
   For example: `docker volume rm client_data01 docker_hapi-mysql` would delete the `client_data01` and `docker_hapi-mysql` volumes.

### Shared install instructions

1. Ensure the system is fully running with these three calls:

    ```bash
    yarn
    yarn docker:build
    yarn docker:instant init -t docker core
    ```
   
 1. Check the install is successful with `docker ps`. The output should show 7 containers like this:
 
    ```bash
    CONTAINER ID   IMAGE                        COMMAND                  CREATED              STATUS              PORTS                                                                                        NAMES
    ed50e7137bf3   hapiproject/hapi:v5.2.1      "catalina.sh run"        27 seconds ago       Up 23 seconds       0.0.0.0:3447->8080/tcp                                                                       hapi-fhir
    ae54bed90fbc   mongo:4.2                    "docker-entrypoint.s…"   29 seconds ago       Up 25 seconds       0.0.0.0:27017->27017/tcp                                                                     mongo-1
    5091d792ebfc   mysql:5.7                    "docker-entrypoint.s…"   30 seconds ago       Up 26 seconds       0.0.0.0:3306->3306/tcp, 33060/tcp                                                            hapi-mysql
    58c6a5b4c5ce   jembi/openhim-console:1.14   "/docker-entrypoint.…"   30 seconds ago       Up 26 seconds       0.0.0.0:9000->80/tcp                                                                         openhim-console
    d71a1ca76d88   jembi/openhim-core:5         "docker-entrypoint.s…"   30 seconds ago       Up 27 seconds       0.0.0.0:5000-5001->5000-5001/tcp, 0.0.0.0:5050-5052->5050-5052/tcp, 0.0.0.0:8080->8080/tcp   openhim-core
    f8a6b44288bb   mongo:4.2                    "docker-entrypoint.s…"   About a minute ago   Up About a minute   27017/tcp                                                                                    mongo-2
    8c500e8a71ce   mongo:4.2                    "docker-entrypoint.s…"   About a minute ago   Up About a minute   27017/tcp                                                                                    mongo-3
    ``` 
1. Set OpenHIM Console to use `cop.app.medicmobile.org` instead of `localhost`: `docker exec -it openhim-console sh -c "sed -i 's/localhost/cop.app.medicmobile.org/g' config/default.json"`
