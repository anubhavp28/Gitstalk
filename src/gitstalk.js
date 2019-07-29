"use strict";
const axios = require('axios');
const emoji = require('node-emoji');
const moment = require('moment');
const ora = require('ora');

function parseGitHubResponse(response, cb) {
    response.data.forEach(el => {
        let activity = {
            time: moment(el.created_at).fromNow()
        };
        switch (el.type) {
            case "PushEvent":
                activity.emoji = emoji.get('heavy_plus_sign');
                activity.msg = `Pushed ${el.payload.size} commits to ${el.repo.name}.`;
                break;
            case "DeleteEvent":
                activity.emoji = emoji.get('wastebasket') + " ";
                activity.msg = `Deleted a ${el.payload.ref_type} ${el.payload.ref} from ${el.repo.name}.`;
                break;
            case "CreateEvent":
                activity.emoji = emoji.get('construction');
                if (el.payload.ref_type == "repository")
                    activity.msg = `Created a ${el.payload.ref_type} ${el.repo.name}.`;
                else
                    activity.msg = `Created a ${el.payload.ref_type} ${el.payload.ref} from ${el.repo.name}.`;
                break;
            case "ForkEvent":
                activity.emoji = emoji.get('fork_and_knife');
                activity.msg = `Forked ${el.payload.forkee.full_name} from ${el.repo.name}.`;
                break;
            case "IssueCommentEvent":
                let action = el.payload.action.charAt(0).toUpperCase() + el.payload.action.slice(1);
                activity.emoji = emoji.get('fork_and_knife');
                activity.msg = `${action} a comment on an issue in ${el.repo.name}.`;
                break;
            default:
                activity = null;
        };
        if (activity)
            cb(activity);
    });
}

function printActivity(activity) {
    console.log(activity.emoji + " [" + activity.time + "] " + activity.msg);
}

function getUserActivityLog(user) {
    let spinner = ora('Fetching latest activity ... ').start();
    axios.get(`https://api.github.com/users/${user}/events`)
        .then(function (response) {
            spinner.stop();
            parseGitHubResponse(response, printActivity);
        })
        .catch(function (error) {
            console.log(error + "Unable to contact GitHub API servers. Check your internet connection.");
        });

}

if (process.argv.length >= 2) {
    getUserActivityLog(process.argv[2]);
}
else {
    console.error('Invaild or insufficient argument(s) supplied.')
}

