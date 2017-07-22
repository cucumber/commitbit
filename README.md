# Commitbit

Commitbit is a microservice that grants commit access to every user who has a
pull request merged on GitHub.

This removes manual labour on GitHub repos with a liberal commit bit policy.

The rest of this document explains how to install, configure and use commitbit.

## Create a personal auth token

Create a [personal auth token](https://github.com/settings/tokens) with the
following scopes:

* `admin:org`
* `admin:repo_hook`

Define it in an environment variable:

    export GITHUB_AUTH_TOKEN=REPLACE-WITH-YOUR-AUTH-TOKEN-HERE

## Define a secret for the webhook

    export GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32)

## Create a commitbit team

Create a [GitHub Team](https://help.github.com/articles/organizing-members-into-teams/)
called `Committers` (or something similar), which is the team all committers get
added to.

Define the id of the team:

    export GITHUB_TEAM_ID=$(./team-id REPLACE-WITH-YOUR-ORG-NAME-HERE REPLACE-WITH-YOUR-TEAM-NAME-HERE)

## Deployment

    ./deploy

## Install WebHook

Install a Github *organization wide* WebHook by going to `https://github.com/organizations/REPLACE-WITH-YOUR-ORG-NAME-HERE/settings/hooks`

Find the WebHook URL:

    serverless info | grep POST | tr -s ' ' | cut -d' ' -f4

And remind yourself the secret:

    echo $GITHUB_WEBHOOK_SECRET

Fill in the WebHook form with those values, and specify Content type `application/json`

## That's it

Every push to any of the repos in your GitHub organisation will now invoke the
commitbit microservice. The service adds all committers in a push to the team you
specified.

This is a little overkill (it would have been sufficient to look at committers in
merge pull requests), but the current implementation seemed like the simplest one.

## Credit

The commitbit microservice is based on [Serverless Github webhook listener](https://github.com/serverless/examples/tree/master/aws-node-github-webhook-listener)
from the [Serverless Framework](https://serverless.com/).
