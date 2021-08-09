# Infrastructure for Community of Practice (CoP) Interoperability Project

## Overview 

These steps use code directly take from the [Instant OpenHIE](https://github.com/openhie/instant/tree/master/core/docker) and located in the [CHIS Interoperability repository](https://github.com/medic/chis-interoperability) to provision an instance of the Instant OpenHIE on `cop.app.medicmobile.org`.

### Status

This project is still in a nascent state where a full end to end Loss To Follow Up (LTFU) process has not yet been implemented.  The goal will be to fully implement this [LTFU workflow](https://wiki.ohie.org/display/SUB/Use+Case+Summary:+Request+Community+Based+Follow-Up). 

### Services

Services are currently available at these URLs:

* **OpenHIM Admin Console** - [https://cop.app.medicmobile.org:9001/](https://cop.app.medicmobile.org:9001/) 
* **OpenHIM** - [https://cop.app.medicmobile.org:5002/](https://cop.app.medicmobile.org:5002/) (Do not use the insecure port on 5000 or 5001)
* **HAPI FHIR** - Currently only accessible via SSH tunnel:
   1. Confirm which IP is being used by `hapi-fire` container (likely this won't change, only check once) by running this on the main server: 
   
      `docker inspect hapi-fhir|grep '"IPAddress": "172'`
   1. Set up tunnel via SSH (assumes IP from prior step is `172.24.0.9`):
   
      `ssh -L 8080:172.24.0.9:8080 cop.app.medicmobile.org  -p 33696`
   1. Go to [http://localhost:8080](http://localhost:8080) in your browser


### OpenHIM Configuration

OpenHIM has this configuration:

Channels:
* `/fhir/*` - any requests to `https://cop.app.medicmobile.org:5002/fhir/*` are routed to the FHIR server.  Currently this includes `/fhir/Patient` and `/fhir/Provider`

Clients:

See `sudo cat ~root/logins.txt` for credentials for these on `cop.app.medicmobile.org`.  Each integration should use their login so that OpenHIM can track which system made the call:

* `cht`
* `opensrp`
* `commcare` 

## Prerequisites 

  * dedicated Ubuntu 18.04 server
  * static IP
  * 8 GB RAM / 30GB Disk
  * run all commands as a non-root user with `sudo` perms
  * have DNS entry pointing to the static IP.  We'll be using `cop.app.medicmobile.org`. 
  * `certbot` [installed](https://certbot.eff.org/).  
 *  `docker` and `docker-compose` [installed](https://github.com/openhie/instant/tree/master/core/docker#prerequisites).

## Install & First Time Run

This process is safe to re-run entirely or in sub-sections:

1. `cd` into the `/srv/chis/` directory
1. Get certificates for your domain via `certbot` with `sudo certbot certonly --nginx`.  

   Ensure the certificates are in `/etc/letsencrypt/live` when this command is done.
1. Clone this repo `git clone https://github.com/medic/chis-interoperability.git`
1. `cd` into the newly cloned repo into the `./chis-interoperability/docker` directory
1. Add yourself to the `docker` group by running the `./configure-docker.sh` script. Enter your `sudo` password when prompted. You may see some errors - this is OK.
1. Initialize and start the system by calling `./compose.sh init`. This command can take a good 5 minutes to run - please be patient before proceeding to the next step.
1. Check the `init` call was successful with `docker ps`. The output should show 8 containers like this:
 
    ```bash
    CONTAINER ID   IMAGE                        COMMAND                  CREATED          STATUS          PORTS                                                                                                                                                                                NAMES
    6abddc0db494   nginx:latest                 "/docker-entrypoint.…"   17 seconds ago   Up 15 seconds   0.0.0.0:5002->5002/tcp, :::5002->5002/tcp, 0.0.0.0:5051->5051/tcp, :::5051->5051/tcp, 0.0.0.0:8080->8080/tcp, :::8080->8080/tcp, 80/tcp, 0.0.0.0:9001->9001/tcp, :::9001->9001/tcp   nginx-proxy
    f9e318f9c31a   jembi/openhim-core:5         "docker-entrypoint.s…"   19 seconds ago   Up 17 seconds   0.0.0.0:5000-5001->5000-5001/tcp, :::5000-5001->5000-5001/tcp, 0.0.0.0:5050->5050/tcp, :::5050->5050/tcp, 0.0.0.0:5052->5052/tcp, :::5052->5052/tcp                                  openhim-core
    9d6716697d6f   instant_diym                 "docker-entrypoint.s…"   29 seconds ago   Up 28 seconds   5051/tcp                                                                                                                                                                             diym
    25311fbbcc4f   hapiproject/hapi:v5.2.1      "catalina.sh run"        2 months ago     Up 2 months     8080/tcp                                                                                                                                                                             hapi-fhir
    e09773683681   jembi/openhim-console:1.14   "/docker-entrypoint.…"   2 months ago     Up 2 months     80/tcp                                                                                                                                                                               openhim-console
    c02a96962d4b   mysql:5.7                    "docker-entrypoint.s…"   2 months ago     Up 2 months     3306/tcp, 33060/tcp                                                                                                                                                                  hapi-mysql
    8da6786552cf   mongo:4.2                    "docker-entrypoint.s…"   2 months ago     Up 2 months     27017/tcp                                                                                                                                                                            mongo-2
    f70681545611   mongo:4.2                    "docker-entrypoint.s…"   2 months ago     Up 2 months     27017/tcp                                                                                                                                                                            mongo-3
    0a6b794b751f   mongo:4.2                    "docker-entrypoint.s…"   2 months ago     Up 2 months     27017/tcp                                                                                                                                                                            mongo-1
    ``` 

1. You should now be to log in on the [FHIR admin console](https://cop.app.medicmobile.org:9001) with the default username `root@openhim.org` and password `instant101`. Change the `root@openhim.org` password as well as the [Client password](https://cop.app.medicmobile.org:9001/#!/clients) for the `test` client. Create any additional client logins that are needed.

## Docker Restart, Shut-down & Delete

`cd` into the cloned repo: `cd /srv/chis/instant/core/docker` directory. Then:

* To shut-down the containers run `./compose.sh down` to stop the instances.
* To then restart the containers, run `./compose.sh up`. You do not need to run `init` again like you did in install above.
* To shut-down and delete *everything*, run `./compose.sh destroy`

## OS reboots

Currently, if the server is rebooted, Docker needs to be restarted with `/srv/chis/instant/core/docker/compose.sh up`

## Development environment

By leveraging the free wildcard certificates with accompanied DNS entries offered by [local-ip.co](http://local-ip.co), a development instance with valid certificates can easily be set up to enable development with no external dependencies.  This does assume there's sufficient CPU, RAM and Disk resources to run all the Docker containers.

Assuming your ip is `192.168.68.40` and your user has permission to run `docker-compose`, we can simply prepend `DEV=192.168.68.40` to the `compose.sh` script:
1. Clone this repo `git clone https://github.com/medic/chis-interoperability.git`
1. `cd` into the newly cloned repo into the `./chis-interoperability/docker` directory
1. Initialize the deployment with `DEV=192.168.68.40 ./compose.sh init`.  All subsequent calls of `up`, `down` and `destroy` should be made via `DEV=192.168.68.40 ./compose.sh COMMAND` 

If you have an dev instance that is long-running, and the certificates expire, you can renew them with `./docker/refresh-local-ip-certs.sh`
