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

  if (githubEvent !== 'pull_request') {
    errMsg = '[422] X-Github-Event was "' + githubEvent + '", but expected "pull_request"';
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

  try {
    github.authenticate({
      type: "token",
      token: authToken
    })

    const prEvent = event.body
    const pr = prEvent.pull_request
    const user = pr.user.login
    const owner = prEvent.repository.owner.login
    const repo = prEvent.repository.name
    const number = prEvent.number

    const reaction = {
      owner: owner,
      repo: repo,
      number: number,
      content: 'heart'
    }
    const comment = {
      owner: owner,
      repo: repo,
      number: number,
      body: `Hi @${user},
Thanks for your contribution and welcome to the committers team!
You can now push directly to this repo and all other repos under the cucumber
organization. Please read up on the general contributing guidelines to learn more.

Cheers,
Aslak Hellesøy
Creator of Cucumber
`
    }

    if (pr.state == "closed" && pr.merged) {
      github.orgs.getTeamMembership({id: teamId, username: user}, function (err, isMember) {
        if(err) return callback(new Error("[500] " + err.message))
        if(isMember) return callback(null, {
          statusCode: 200,
          body: `${user} is already a member`
        })

        github.orgs.addTeamMembership({id: teamId, username: user}, function (err) {
          if(err) return callback(new Error("[500] " + err.message))

          github.issues.createComment(comment, function (err) {
            if(err) return callback(new Error("[500] " + err.message))

            callback(null, {
              statusCode: 200,
              body: `Commented on ${pr.url}`,
            })
          })
        })
      })
    } else {
      callback(null, {
        statusCode: 200,
        body: `Nothing to do`,
      })
    }

  } catch(err) {
    err.message = `[500] ${err.message}`
    callback(err)
  }
};
