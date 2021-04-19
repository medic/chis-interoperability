# Infrastructure for Community of Practice (CoP) Interoperability Project

## Overview 

TBD

## Install

These steps use the OpenHIE Instante repo using the [docker-compose steps](https://github.com/openhie/instant/tree/master/core/docker). Start by `cd`ing into the `/srv/chis/` directory and ensure your user has `sudo` perms.

1. Ensure Docker and Docker Compose are installed per the [Instant OpenHIE Prerequisites](https://github.com/openhie/instant/tree/master/core/docker#prerequisites).
1. Check out the repo `git clone https://github.com/openhie/instant.git`
1. `cd` into the newly cloned repo into the `./instant/core/docker` directory
1. Add yourself to the `docker` group by running the `./configure-docker.sh` script. Enter your `sudo` password when prompted. You may see some errors - this is OK.
1. Initialize and start the system by calling `./compose.sh init`
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
   If you're quick on the draw, you may see an 8th container called `jembi/instantohie-config-importer`. This is an artifact of calling `init` and will go away so there will only be 7 containers.
1. Set OpenHIM Console to use `cop.app.medicmobile.org` instead of `localhost`: `docker exec -it openhim-console sh -c "sed -i 's/localhost/cop.app.medicmobile.org/g' config/default.json"`
1. Visit [the heartbeat URL](https://cop.app.medicmobile.org:8080/heartbeat) and accept the self signed certificate. This is required for the next step as the console will fail to do a `POST` to the FHIR core unless the certificate is accepted first.
1. Finally, you should be to log in on the [FHIR admin console](cop.app.medicmobile.org:9000) with username `root@openhim.org` and password `instant101`

## Docker Restart, Shut-down & Delete

`cd` into the cloned repo: `cd /srv/chis/instant/core/docker` directory. Then:

* To shut-down the containers run `./compose.sh down` to stop the instances.
* To then restart the containers, run `./compose.sh up`. You do not need to run `init` again like you did in install above.
* To shut-down and delete *everything*, run `./compose.sh destroy`

## OS reboots

Currently if the server is rebooted, Docker needs to be restarted with `/srv/chis/instant/core/docker/compose.sh up`