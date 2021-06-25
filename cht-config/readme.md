# CHT Configuration for CHIS

## Production

After  configuring the OpenHIM server (in this case running at `cop.app.medicmobile.org`), add a `Client` to the OpenHIM with a `cht` login and a secure password.  As well, after you have provisioned an install of the CHT (in this case running at `cht-cop-interop.dev.medicmobile.org`), you need to configure outbound push in the CHT to push `Patient` and `Practitioner` resources to the HAPI FHIR instance via OpenHIM.  

To do this, push the configuration in this `cht-config` directory with the following command (originally done in #1). Be sure to pass in the real password instead of `REAL-PASSWORD-HERE`:

```shell
medic-conf --url=https://medic:REAL-PASSWORD-HERE@cht-cop-interop.dev.medicmobile.org/ compile-app-settings backup-app-settings upload-app-settings
```

After doing this, you'll need to set the password that the CHT will use for the `cht` user in calls to OpenHIM.  Use this command to set the password (originall done in #17).  Again, be sure to pass in the real passwords instead of `REAL-PASSWORD-HERE` and `CHT-CLIENT-PASSWORD-HERE`:

```shell
curl  -X PUT https://medic:REAL-PASSWORD-HERE@cht-cop-interop.dev.medicmobile.org/_node/couchdb@127.0.0.1/_config/medic-credentials/cop.app.medicmobile.org -d '"CHT-CLIENT-PASSWORD-HERE"'
```

## Development

After setting up a dev instance of OpenHIM and a dev instance of the CHT, run the same commands as for production, but changing them to use your local dev instance instead. 

Assuming both your CHT and OpenHIM instances are at `192.168.68.40` and both are using [local-ip.co](http://local-ip.co) certificates and `docker-compose`, first edit the two `base_url` values in `app_settings.json` to match the URL for your dev OpenHIM instance: 

```
"base_url": "https://192-168-68-40.my.local-ip.co:5002",
```

Then push the config to your CHT instance:

```shell
medic-conf --url=https://medic:password@192-168-68-40.my.local-ip.co/ compile-app-settings backup-app-settings upload-app-settings
```

Assuming the OpenHIM has been set up with the same `cht` user sd production and the literal password of `test`, set the CHT user  password with this call:

```shell
curl  -X PUT https://medic:password@192-168-68-40.my.local-ip.co/_node/couchdb@127.0.0.1/_config/medic-credentials/cop.app.medicmobile.org -d '"test"'
```

Note: A bit awkward, but for consistency's sake we'll keep the key value of `cop.app.medicmobile.org` in the URL above the same, as opposed to changing it match our dev URL.