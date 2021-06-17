const rpn = require('request-promise-native');
process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;
const minimist = require('minimist');

const argv = minimist(process.argv.slice(2), {
  alias: {
    'h': 'help'
  }
});

if(argv.h || !argv.couchurl || !argv.uid || !argv.value || !argv.field) {
  console.log(`
Set field value for a user directly in CouchDB - does not use CHT API.

NOTE: FOR DEVELOPMENT ONLY! DOES NOT CHECK FOR VALID TLS CERTIFICATES!!

Usage:
      node set-external-id.js -h | --help
      node set-external-id.js --couchurl https://medic:password@localhost --uid 12345 --field external_id --value 54321

Options:
    -h --help     Show this screen.
    --couchurl    The url for couchdb. Must include HTTP basic auth credentials if needed.
    --uid         The user you want to update
    --field       The field to set
    --value       The value to set to field

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

    const postOptions = Object.assign({}, options);
    postOptions.uri = url.href + '?rev=' + user._rev;
    user[argv.field] = argv.value;
    postOptions.body = user;
    try {
      await rpn.put(postOptions);
    } catch (e) {
      console.log('An error while updating the user - ', e.message);
      process.exit(0);
    }
  } catch (e) {
    console.log('An error while getting the user - ', e.message);
    process.exit(0);
  }
};

console.log('success')

execute();
