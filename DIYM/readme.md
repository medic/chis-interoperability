# Do it yourself mediator

Do it yourself mediator, or DIYM for short, is containerized Node.js script that accepts a `POST` from a point of service system (eg [Community Health Toolkit](https://communityhealthtoolkit.org/)), looks up the ID via the OpenHIM and then writes this ID back to the service system.

Currently, there is only an integration with the CHT, but it could be extended to support other systems.  

## Installation & Configuration

By default, when deploying the [OpenHIM via this repo](../), an un-configured DIYM is deployed for you on port `5003`.  To configure it, update the OpenHIM URL and credentials and the CHT URL and credentials in the config file. To do this, copy the `./config/diym.conf.dist.yml` to  `./config/diym.conf.dist.yml` and edit the file in the `openhim` and `chw_systems` sections respectively.

As well, you'll need to update the credentials for the DIYM which the service systems will use to authenticate with. This is found in the `diym_credentials` section.

For values that are not needed you can just specify an empty string with `''`. For example if no port is needed, you would use `port: ''`

In order to get the CHT to make calls to DIYM, update the URLs in `../cht-config/app_settings.json` for the `FHIR_CHT_id` section.  Be sure that the you've set the DIYM password in the `diym.conf.yml` to match what you've pushed in with the `curl` call to set the `medic-credentials`.

## Updating

When you first run `./compose.sh init`, Docker will notice that you don't have an image for the `diym` container and build it for your.  This will be cached. To update the image if you've made code changes to `index.js` or `package.js`, you'll need to first call `./compose.sh down` to stop all containers.  Then delete the image with `docker image rm -f instant_diym`. Then when you run `./compose.sh up`, all the layers wil be rebuilt to include any changes you've made. When prompted with `Continue with the new image? [yN]` answer `y`. 

Note: This is a bad experience for development as it's slow and tedious.  See the "Development" section below for doing active development.

## Development

When doing development on DIYM, you should use [nodemon](https://nodemon.io/) and not use docker.  This will automatically reload your node app any time there are changes.  When you're done with your changes and what to deploy them, follow the "Updating" section above. 

Start by installing `nodemon` with `sudo npm i nodemon -g`. You'll be prompted to either log back in or run some commands to sync up your environment. After than, install the DIYM dependencies with `npm install`.  Then you can start the app in development mode by prepending `DEV_PORT` and specifying the port you want to use: `DEV_PORT=5005 nodemon index.js`

Since DIYM only supports the CHT now, start by creating a Patient in the CHT and grabbing the ID for it.  Then update `../cht-config/sample.cht.patient.json` with the ID of your Patient.  So if you had a new CHT Patient with ID `1234-5678-90abcd`, it would like this in the json:

```json
  "identifier": {
    "use": "usual",
    "value": "cht/1234-5678-90abcd"
  },
```

With this in place, you can do mock calls to the DIYM with a CLI call using curl. Assuming your `DEV_PORT` is set to `5053`, your IP is `192.168.68.40` and you're in the `chis-interoperability` directory, the call would be:

```shell
curl -sv -X POST -H "Content-Type: application/json" -d @cht-config/sample.cht.patient.json http://test:test@localhost:5005/join_object/cht
```