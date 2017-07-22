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

  if (githubEvent !== 'XX') {
    errMsg = '[422] X-Github-Event was "' + githubEvent + '", but expected "XX"';
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

  const prEvent = event.body
  const user = prEvent.user.login
  const pr = prEvent.pull_request
  const owner = pr.repo.owner.login
  const repo = pr.repo.name

  function createIssueReaction(cb) {
    github.reactions.createForIssue({
      owner: owner,
      repo: repo,
      number: pr.id,
      content: ':clap:'
    }, cb)
  }

  function createIssueComment(cb) {
    github.issues.createComment({
      owner: owner,
      repo: repo,
      number: pr.id,
      body: `Hi @${user},
Thanks for your contribution and welcome to the committers team!
You can now push directly to this repo and all other repos under the cucumber
organization. Please read up on the general contrinuting guidelines to learn more.

Cheers,
Aslak Hellesøy
Creator of Cucumber
`
    }, cb)
  }

  // if(pr.state == "closed" && pr.merged)
  createIssueReaction(function (err) {
    if(err) return callback(err)

    createIssueComment(function (err) {
      if(err) return callback(err)

      const response = {
        statusCode: 200,
        body: JSON.stringify(usernames),
      }

      callback(null, response)
    })
  })

  // const usernames = []
  //
  // function addTeamMembership(commit, cb) {
  //   const username = commit.author.username
  //   if(usernames.indexOf(username) >= 0) return cb()
  //   usernames.push(username)
  //   github.orgs.addTeamMembership({id: teamId, username: username}, cb);
  // }
  //
  // each(event.body.commits, addTeamMembership, function(err) {
  //   if (err) return callback(err)
  //
  //   const response = {
  //     statusCode: 200,
  //     body: JSON.stringify(usernames),
  //   };
  //
  //   callback(null, response);
  // })
};
