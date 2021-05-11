# Infrastructure for Community of Practice (CoP) Interoperability Project

## Overview 

These steps use code directly take from the [OpenHIE Instant](https://github.com/openhie/instant/tree/master/core/docker) and located in the [CHIS Interoperability repository](https://github.com/medic/chis-interoperability) to provision an instance of the Instant OpenHIE on `cop.app.medicmobile.org`.

### Services

Services are currently available at these URLs:

* **OpenHIM Admin Console** - [https://cop.app.medicmobile.org:9001/](https://cop.app.medicmobile.org:9001/) 
* **OpenHIM** - [https://cop.app.medicmobile.org:5003/](https://cop.app.medicmobile.org:5003/) (Do not use the insecure port on 5000 or 5001)
* **HAPI FHIR** - Currently only accessible via SSH tunnel:
   1. Confirm which IP is being used by `hapi-fire` container (likely this won't change, only check once) by running this on the main server: 
   
      `docker inspect hapi-fhir|grep '"IPAddress": "172'`
   1. Set up tunnel via SSH (assumes IP from prior step is `172.24.0.9`):
   
      `ssh -L 8080:172.24.0.9:8080 cop.app.medicmobile.org  -p 33696`
   1. Go to [http://localhost:8080](http://localhost:8080) in your browser

## Prerequisites 

  * dedicated Ubuntu 18.04 server
  * static IP
  * 8 GB RAM / 30GB Disk
  * run all commands as a non-root user with `sudo` perms
  * have DNS entry pointing to the static IP.  We'll be using `cop.app.medicmobile.org`. 
  * user with `sudo` 
  * `certbot` [installed](https://certbot.eff.org/).  
 *  `docker` and `docker-compose` [installed](https://github.com/openhie/instant/tree/master/core/docker#prerequisites).

## Install

This process is safe to re-run entirely or in sub-sections:

1. `cd` into the `/srv/chis/` directory
1. Get certificates for your domain via `certbot` with `sudo certbot certonly --nginx`.  

   Ensure the certficates are in `/etc/letsencrypt/live` when this command is done.
1. Clone this repo `git clone https://github.com/medic/chis-interoperability.git`
1. `cd` into the newly cloned repo into the `./chis-interoperability/docker` directory
1. Add yourself to the `docker` group by running the `./configure-docker.sh` script. Enter your `sudo` password when prompted. You may see some errors - this is OK.
1. Initialize and start the system by calling `./compose.sh init`
1. Check the `init` call was successful with `docker ps`. The output should show 8 containers like this:
 
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
1. Visit [the heartbeat URL](https://cop.app.medicmobile.org:8080/heartbeat) and accept the self signed certificate. This is required for the next step as the console will fail to do a `POST` to the FHIR core unless the certificate is accepted first.
1. You should now be to log in on the [FHIR admin console](https://cop.app.medicmobile.org:9001) with the defaulte username `root@openhim.org` and password `instant101`. Change the `root@openhim.org` password as well as the [Client password](https://cop.app.medicmobile.org:9001/#!/clients) for the `test` client. Create any additional logins that are needed.

## Docker Restart, Shut-down & Delete

`cd` into the cloned repo: `cd /srv/chis/instant/core/docker` directory. Then:

* To shut-down the containers run `./compose.sh down` to stop the instances.
* To then restart the containers, run `./compose.sh up`. You do not need to run `init` again like you did in install above.
* To shut-down and delete *everything*, run `./compose.sh destroy`

## OS reboots

Currently if the server is rebooted, Docker needs to be restarted with `/srv/chis/instant/core/docker/compose.sh up`