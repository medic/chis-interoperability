const rpn = require('request-promise-native');
process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2), {
  alias: {
    'h': 'help'
  }
});

if(argv.h || !argv.couchurl || !argv.uid || !argv.eid) {
  console.log(`
Set external_id for a user directly in CouchDB - does not use CHT API.

NOTE: FOR DEVELOPMENT ONLY! DOES NOT CHECK FOR VALID TLS CERTIFICATES!!

Usage:
      node set-external-id.js -h | --help
      node set-external-id.js --couchurl https://medic:password@localhost --uid 12345 --eid 54321

Options:
    -h --help     Show this screen.
    --couchurl    The url for couchdb. Must include HTTP basic auth credentials if needed.
    --uid         The user you want to update
    --eid         The value to set external_id to

`);
  process.exit(0);
}

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;

let url;
try {
  url = new URL('/medic/' + argv.uid, argv.couchurl);
} catch(e) {
  console.log('Error while creating url', e.message);
}

const options = {
  uri: url.href,
  json: true,
  rejectUnauthorized: false
};

const execute = async () => {
  let user = [];
  try {
    user = await rpn.get(options);
  } catch (e) {
    console.log('An error while getting the user - ', e.message);
    process.exit(0);
  }

  console.log('got user: ' + JSON.stringify(user));
};

execute();
