const crypto = require('crypto');
const each = require('async/each');
const GitHubApi = require('github');
const github = new GitHubApi();

function signRequestBody(key, body) {
  return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`;
}

module.exports.githubWebhookListener = (event, context, callback) => {
  var errMsg; // eslint-disable-line
  const token = process.env.GITHUB_WEBHOOK_SECRET;
  const teamId = process.env.GITHUB_TEAM_ID;
  const authToken = process.env.GITHUB_AUTH_TOKEN;
  const headers = event.headers;
  const sig = headers['X-Hub-Signature'];
  const githubEvent = headers['X-GitHub-Event'];
  const id = headers['X-GitHub-Delivery'];
  const calculatedSig = signRequestBody(token, JSON.stringify(event.body));

  if (typeof token !== 'string') {
    errMsg = '[401] must provide a \'GITHUB_WEBHOOK_SECRET\' env variable';
    return callback(new Error(errMsg));
  }

  if (typeof teamId !== 'string') {
    errMsg = '[401] must provide a \'GITHUB_TEAM_ID\' env variable';
    return callback(new Error(errMsg));
  }

  if (typeof authToken !== 'string') {
    errMsg = '[401] must provide a \'GITHUB_AUTH_TOKEN\' env variable';
    return callback(new Error(errMsg));
  }

  if (!sig) {
    errMsg = '[401] No X-Hub-Signature found on request';
    return callback(new Error(errMsg));
  }

  if (!githubEvent) {
    errMsg = '[422] No X-Github-Event found on request';
    return callback(new Error(errMsg));
  }

  if (!id) {
    errMsg = '[401] No X-Github-Delivery found on request';
    return callback(new Error(errMsg));
  }

  if (sig !== calculatedSig) {
    errMsg = '[401] X-Hub-Signature incorrect. Github webhook token doesn\'t match';
    return callback(new Error(errMsg));
  }

  github.authenticate({
    type: "token",
    token: authToken
  })

  const usernames = []

  function addTeamMembership(commit, cb) {
    const username = commit.author.username
    usernames.push(username)
    github.orgs.addTeamMembership({id: teamId, username: username}, cb);
  }

  each(event.body.commits, addTeamMembership, function(err) {
    if (err) return callback(err)

    const response = {
      statusCode: 200,
      body: JSON.stringify(usernames),
    };

    callback(null, response);
  })
};
