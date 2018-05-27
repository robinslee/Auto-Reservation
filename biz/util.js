"use strict";

const asyncRequest = require("async-http-request");

const {
    url_base:       BASE_URL,
    host:           HOST,
    url_reserve:    RESERVER_URL,
    session_cookie: COOKIE
} = global.CONFIG;

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11",
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; SE 2.X MetaSr 1.0; SE 2.X MetaSr 1.0; .NET CLR 2.0.50727; SE 2.X MetaSr 1.0)",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0;"
];

function log(msg) {
    let date = new Date();

    if (console) {
        console.log(`${date} -- ${msg}`);
    }
}

function getRandomUA() {
    let len = USER_AGENTS.length;
    return USER_AGENTS[Math.floor(Math.random() * 5)];
}

async function execRequest(options, referer) {
    let jar = await asyncRequest.jar();
    let cookie = await asyncRequest.cookie(COOKIE);
    jar.setCookie(cookie, BASE_URL);

    let userAgent = getRandomUA();
    let defaultOpts = {
        method: "GET",
        jar: jar,
        headers: {
            Host: HOST,
            Referer: referer,
            Origin: BASE_URL,
            "User-Agent": userAgent
        }
    };
    return await asyncRequest(Object.assign(defaultOpts, options));
}

async function sendReserveRequest(formData, referer) {
    return execRequest({
        method: "POST",
        url: RESERVER_URL,
        form: formData
    }, referer);
}

module.exports = {
    log,
    getRandomUA,
    execRequest,
    sendReserveRequest
}