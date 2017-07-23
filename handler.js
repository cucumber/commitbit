const crypto = require('crypto')
const ejs = require('ejs')
const GitHubApi = require('github')
const github = new GitHubApi()

function signRequestBody(key, body) {
  return `sha1=${crypto.createHmac('sha1', key).update(body, 'utf-8').digest('hex')}`
}

module.exports.githubWebhookListener = (event, context, callback) => {
  var errMsg
  const token = process.env.GITHUB_WEBHOOK_SECRET
  const teamId = process.env.GITHUB_TEAM_ID
  const authToken = process.env.GITHUB_AUTH_TOKEN
  const headers = event.headers
  const sig = headers['X-Hub-Signature']
  const githubEvent = headers['X-GitHub-Event']
  const id = headers['X-GitHub-Delivery']
  const calculatedSig = signRequestBody(token, JSON.stringify(event.body))

  if (typeof token !== 'string') {
    errMsg = '[401] must provide a \'GITHUB_WEBHOOK_SECRET\' env variable'
    return callback(new Error(errMsg))
  }

  if (typeof teamId !== 'string') {
    errMsg = '[401] must provide a \'GITHUB_TEAM_ID\' env variable'
    return callback(new Error(errMsg))
  }

  if (typeof authToken !== 'string') {
    errMsg = '[401] must provide a \'GITHUB_AUTH_TOKEN\' env variable'
    return callback(new Error(errMsg))
  }

  if (!sig) {
    errMsg = '[401] No X-Hub-Signature found on request'
    return callback(new Error(errMsg))
  }

  if (!githubEvent) {
    errMsg = '[422] No X-Github-Event found on request'
    return callback(new Error(errMsg))
  }

  if (githubEvent !== 'pull_request') {
    errMsg = '[422] X-Github-Event was "' + githubEvent + '", but expected "pull_request"'
    return callback(new Error(errMsg))
  }

  if (!id) {
    errMsg = '[401] No X-Github-Delivery found on request'
    return callback(new Error(errMsg))
  }

  if (sig !== calculatedSig) {
    errMsg = '[401] X-Hub-Signature incorrect. Github webhook token doesn\'t match'
    return callback(new Error(errMsg))
  }

  try {
    const prEvent = event.body
    const pr = prEvent.pull_request
    const user = pr.user.login
    const owner = prEvent.repository.owner.login
    const repo = prEvent.repository.name
    const number = prEvent.number

    if (pr.state == "closed" && pr.merged) {
      ejs.renderFile(__dirname + '/welcome.ejs', {user, owner, repo}, function(err, welcome) {
        if(err) return callback(new Error("[500] " + err.message))

        const comment = {
          owner: owner,
          repo: repo,
          number: number,
          body: welcome
        }

        github.authenticate({
          type: "token",
          token: authToken
        })

        github.orgs.getTeamMembership({id: teamId, username: user}, function (err, isMember) {
          // if(err) return callback(new Error("[500] " + err.message))
          if(isMember) return callback(null, {
            statusCode: 200,
            body: `${user} is already a member. Nothing to do.`
          })

          github.orgs.addTeamMembership({id: teamId, username: user}, function (err) {
            if(err) return callback(new Error("[500] " + err.message))

            github.issues.createComment(comment, function (err) {
              if(err) return callback(new Error("[500] " + err.message))

              callback(null, {
                statusCode: 200,
                body: `Added ${user} to team and commented on ${pr.url}`,
              })
            })
          })
        })
      })
    } else {
      callback(null, {
        statusCode: 200,
        body: `Pull request updated, but not merged. Nothing to do`,
      })
    }
  } catch(err) {
    err.message = `[500] ${err.message}`
    callback(err)
  }
}
