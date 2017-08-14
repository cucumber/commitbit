# Commit bit

![commitbit](commitbit.png)

Commit bit is a micro service that hands out a commit bit to contributors
after their first GitHub pull request has been merged.

This liberal policy reduces the workload of the existing team and lowers the barrier
of entry for new team members.

The rest of this document explains how to configure and install the commit bit
micro service.

## Install dependencies

Install Node.js. Then install library dependencies:

    npm install

## Create a personal auth token

Create a [personal auth token](https://github.com/settings/tokens) with the
following scopes:

* `repo` - to comment on pull requests
* `admin:org` - to add contributors to the committers team

Define the token in an environment variable:

    export GITHUB_AUTH_TOKEN=REPLACE-WITH-YOUR-AUTH-TOKEN-HERE

## Define a secret for the WebHook

    export GITHUB_WEBHOOK_SECRET=$(openssl rand -base64 32 | tr -s '/' '-')

## Create a committers team

Create a [GitHub Team](https://help.github.com/articles/organizing-members-into-teams/)
called `committers` (or something similar), which is the team new contributors will
be added to.

Define the id of the team:

    export GITHUB_TEAM_ID=$(./team-id REPLACE-WITH-YOUR-ORG-NAME-HERE REPLACE-WITH-YOUR-TEAM-NAME-HERE)

## Grant team members write access on select repos

Add all repositories you want to give commit bit for to the team. Grant at least write access.

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

*The Cucumber team keeps these values in [1Password](https://1password.com/). Contact one
of the contributors if you want to deploy a new version*

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

Whenever a pull request is merged, the user who submitted the pull request will
be added to the committers team, which will give them write access to repositories.

Contributors will also receive a welcome message (in the pull request) when they get
added.

## Why are there no tests?

Testing this code in a real environment (against GitHub) would require creating
real pull requests, merging them and inspecting whether people were added to a team,
and whether the pull request received a comment. That's a pretty complex test harness
to set up.

Another testing strategy would be to decouple the domain logic from GitHub.
That would give us confidence that the domain logic (if statements) are working,
but it wouldn't give us much confidence that the whole system works.

In the end, it seemed that manual testing was sufficient for this kind of application.
It's easy to (re)invoke webhooks from GitHub's admin panel and inspect results -
a lot easier than it would have been to decouple this code and write automated tests
for it.

For a bigger application with more logic it would make sense, but for this application,
manual testing seemed like the right thing to do.

## Credit

The commitbit microservice is based on [Serverless Github webhook listener](https://github.com/serverless/examples/tree/master/aws-node-github-webhook-listener)
from the [Serverless Framework](https://serverless.com/).
