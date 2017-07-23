# Commitbit

Commitbit is a microservice that grants commit access to every user who has a
pull request merged on GitHub.

This removes manual labour on GitHub repos with a liberal commit bit policy.

The rest of this document explains how to install, configure and use commitbit.

## Create a personal auth token

Create a [personal auth token](https://github.com/settings/tokens) with the
following scopes:

* `repo` - to comment on the PR
* `admin:org` - to add the contributor to the team

Define it in an environment variable:

    export GITHUB_AUTH_TOKEN=REPLACE-WITH-YOUR-AUTH-TOKEN-HERE

## Define a secret for the webhook

    export GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32)

## Create a commitbit team

Create a [GitHub Team](https://help.github.com/articles/organizing-members-into-teams/)
called `committers` (or something similar), which is the team all committers get
added to.

Define the id of the team:

    export GITHUB_TEAM_ID=$(./team-id REPLACE-WITH-YOUR-ORG-NAME-HERE REPLACE-WITH-YOUR-TEAM-NAME-HERE)

## Deployment

    ./deploy

After the first deploy you can redeploy faster:

    serverless deploy function --function githubWebhookListener

## Install WebHook

Install a Github *organization wide* WebHook by going to `https://github.com/organizations/REPLACE-WITH-YOUR-ORG-NAME-HERE/settings/hooks`

Find the WebHook URL:

    serverless info | grep POST | tr -s ' ' | cut -d' ' -f4

And remind yourself the secret:

    echo $GITHUB_WEBHOOK_SECRET

Fill in the WebHook form with those values, and specify Content type `application/json`.

Finally, select only the *Pull request* event.

## That's it

Every push to any of the repos in your GitHub organisation will now invoke the
commitbit microservice. The service adds all committers in a push to the team you
specified.

This is a little overkill (it would have been sufficient to look at committers in
merge pull requests), but the current implementation seemed like the simplest one.

## Welcome message

When the contributor's pull request is merged, the following message will be added
to the pull request:

> Hi @contributor,
>
> Thanks for your contribution and welcome to the <organisation> organization's
> <team> team. This gives you direct commit access to all repositories under
> <org>.
> We encourage you to create branches for new features and bug fixes, and submit
> pull requests, optionally requesting a code review. As soon as someone from the
> core team approves your pull request, just go ahead and merge it yourself.
>
> We hope that this will lower the barrier to entry so that the core teams will grow
> so we can process issues faster. Committers who contribute regularly can be
> compensated financially, and may also be invited to join a core team.
>
> We trust you will use this responsibly. Looking forward to your next pull request!
>
> Aslak Hellesøy
> Cucumber creator and project lead
>

## Credit

The commitbit microservice is based on [Serverless Github webhook listener](https://github.com/serverless/examples/tree/master/aws-node-github-webhook-listener)
from the [Serverless Framework](https://serverless.com/).
