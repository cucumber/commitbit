# Commitbit

![commitbit](commitbit.png)

Commitbit is a microservice that grants commit access to every user who has a
pull request merged on GitHub. This removes manual labour on GitHub repos with
a liberal commit bit policy.

The rest of this document explains how to install, configure and use the commitbit
service.

## Create a personal auth token

Create a [personal auth token](https://github.com/settings/tokens) with the
following scopes:

* `repo` - to comment on pull requests
* `admin:org` - to add contributors to the committers team

Define the token in an environment variable:

    export GITHUB_AUTH_TOKEN=REPLACE-WITH-YOUR-AUTH-TOKEN-HERE

## Define a secret for the webhook

    export GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32)

## Create a committers team

Create a [GitHub Team](https://help.github.com/articles/organizing-members-into-teams/)
called `committers` (or something similar), which is the team new contributors will
be added to.

Define the id of the team:

    export GITHUB_TEAM_ID=$(./team-id REPLACE-WITH-YOUR-ORG-NAME-HERE REPLACE-WITH-YOUR-TEAM-NAME-HERE)

## Create a welcome message template

When a contributor is added to the committers team, a comment is also made on the
pull request welcoming the contributor. You should customise this message to your
own project.

Copy `welcome.ejs.template` to `welcome.ejs`. Change the contents of the file to
what you want.

## Deploy the service

The service gets deployed to [AWS Lambda](https://aws.amazon.com/lambda).
You need to define two environment variables:

    export AWS_ACCESS_KEY_ID=REPLACE-WITH-YOUR-AWS-ACCESS-KEY-ID
    export AWS_SECRET_ACCESS_KEY=REPLACE-WITH-YOUR-AWS-SECRET-ACCESS-KEY

Now, deploy the service.

    ./deploy

After the first deploy you can redeploy faster:

    serverless deploy function --function githubWebhookListener

## Install WebHook

Install a Github *organization wide* WebHook by going to `https://github.com/organizations/REPLACE-WITH-YOUR-ORG-NAME-HERE/settings/hooks`

Find the WebHook URL:

    serverless info | grep POST | tr -s ' ' | cut -d' ' -f4

And remind yourself of the the secret:

    echo $GITHUB_WEBHOOK_SECRET

Fill in the WebHook form with those values, and specify Content type `application/json`.

Finally, select only the *Pull request* event.

## That's it

Every push to any of the repos in your GitHub organisation will now invoke the
commitbit microservice.

Whenever a pull request is merged, the user who submitted the pull request will
be added to a team, and will receive a welcome message in the pull request.

## Credit

The commitbit microservice is based on [Serverless Github webhook listener](https://github.com/serverless/examples/tree/master/aws-node-github-webhook-listener)
from the [Serverless Framework](https://serverless.com/).
