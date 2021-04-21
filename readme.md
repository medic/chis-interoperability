# Infrastructure for Community of Practice (CoP) Interoperability Project

## Overview 

TBD

## Prerequisites 

These steps use the OpenHIE Instante repo using the [docker-compose steps](https://github.com/openhie/instant/tree/master/core/docker). It assumes you have:
  * dedicated Ubuntu 18.04 server
  * static IP
  * have DNS entry pointing to the static IP.  We'll be using `cop.app.medicmobile.org`. 
  * sudo 
  
Be sure to install the needed software before getting started:
1. Install `certbot` per [their instructions](https://certbot.eff.org/).  
1. Ensure `docker` and `docker-compose` are installed per the [Instant OpenHIE Prerequisites](https://github.com/openhie/instant/tree/master/core/docker#prerequisites).

## Install

Start by `cd`ing into the `/srv/chis/` directory and ensure your user has `sudo` perms.

1. Get certificates for your domain via `certbot` with `sudo certbot certonly --nginx`.  

   Ensure the certficates are in `/etc/letsencrypt/live` when this command is done.
1. Clone this repo `git clone https://github.com/medic/chis-interoperability.git`
1. `cd` into the newly cloned repo into the `./chis-interoperability/docker` directory
1. Add yourself to the `docker` group by running the `./configure-docker.sh` script. Enter your `sudo` password when prompted. You may see some errors - this is OK.
1. Create the persistant `instant` storage for Docker: `docker volume create --name=instant` 
1. Initialize and start the system by calling `./compose.sh init`
1. After the `docker-compose` call inside the `compose.sh` script has been running for a few minutes, `ctrl + c` to exit out.
1. Start the Instant OpenHIE process normally with `./compose up` 
1. Check the `up` call is successful with `docker ps`. The output should show 8 containers like this:
 
    ```bash
    CONTAINER ID   IMAGE                        COMMAND                  CREATED          STATUS          PORTS                                                                                                                                                                     NAMES
    cfadf2838d46   nginx:latest                 "/docker-entrypoint.…"   8 seconds ago    Up 3 seconds    0.0.0.0:5002->5002/tcp, :::5002->5002/tcp, 80/tcp, 0.0.0.0:9001->9001/tcp, :::9001->9001/tcp                                                                              nginx-proxy
    517912b14eee   jembi/openhim-core:5         "docker-entrypoint.s…"   8 seconds ago    Up 4 seconds    0.0.0.0:5000-5001->5000-5001/tcp, :::5000-5001->5000-5001/tcp, 0.0.0.0:5050-5052->5050-5052/tcp, :::5050-5052->5050-5052/tcp, 0.0.0.0:8080->8080/tcp, :::8080->8080/tcp   openhim-core
    07475677901d   hapiproject/hapi:v5.2.1      "catalina.sh run"        4 minutes ago    Up 5 seconds    8080/tcp                                                                                                                                                                  hapi-fhir
    288cd025138e   mysql:5.7                    "docker-entrypoint.s…"   4 minutes ago    Up 6 seconds    3306/tcp, 33060/tcp                                                                                                                                                       hapi-mysql
    945ac6a8553d   jembi/openhim-console:1.14   "/docker-entrypoint.…"   4 minutes ago    Up 7 seconds    80/tcp                                                                                                                                                                    openhim-console
    e3eaa16be99b   mongo:4.2                    "docker-entrypoint.s…"   30 minutes ago   Up 30 minutes   27017/tcp                                                                                                                                                                 mongo-1
    f9986917f559   mongo:4.2                    "docker-entrypoint.s…"   4 hours ago      Up 30 minutes   27017/tcp                                                                                                                                                                 mongo-2
    18b17cf57d6b   mongo:4.2                    "docker-entrypoint.s…"   4 hours ago      Up 30 minutes   27017/tcp                                                                                                                                                                 mongo-3
    ``` 
1. Set OpenHIM Console to use `cop.app.medicmobile.org` buy running this call: `docker exec -it openhim-console sh -c "sed -i 's/localhost/cop.app.medicmobile.org/g' config/default.json"`
1. Visit [the heartbeat URL](https://cop.app.medicmobile.org:8080/heartbeat) and accept the self signed certificate. This is required for the next step as the console will fail to do a `POST` to the FHIR core unless the certificate is accepted first.
1. You should now be to log in on the [FHIR admin console](https://cop.app.medicmobile.org:9001) with the defaulte username `root@openhim.org` and password `instant101`. You should now change the `root@openhim.org`  password as well as the [Client password](https://cop.app.medicmobile.org:9001/#!/clients) for the `test` client. 
1. The `openhim-core` container seems to get "stuck" often. This causes all `http` requests to port `8080` to only respond with `404`s, thus breaking all integrations.    

   The fix to this, for now, is to restart the `openhim-core` container every hour.  Do this by creating a cronjob for the root user:
   1. `sudo su -`
   1. `crontab -e`
   1. Add a line at the end that is:
      ```bash
      0 * * * * /usr/bin/docker restart openhim-core
      ```

## Docker Restart, Shut-down & Delete

`cd` into the cloned repo: `cd /srv/chis/instant/core/docker` directory. Then:

* To shut-down the containers run `./compose.sh down` to stop the instances.
* To then restart the containers, run `./compose.sh up`. You do not need to run `init` again like you did in install above.
* To shut-down and delete *everything*, run `./compose.sh destroy`

## OS reboots

Currently if the server is rebooted, Docker needs to be restarted with `/srv/chis/instant/core/docker/compose.sh up`