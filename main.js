"use strict";

global.CONFIG = require("./biz/config.json");

const biz = require("./biz/business");
const util = require("./biz/util");

/*
 * Start the reservation
 */
startReservation();

/*
 * await must be in async function body
 */
async function startReservation() {
    const Config = global.CONFIG;

    let verifyCodes = Config.verify_codes;
    if (!verifyCodes.length) {
        /*
         * Image recognition is in here
         */
        let code = await biz.refreshVerifyCode();
        verifyCodes.push(code);

        util.log(`Verify code is ${code}`);
    }

    let total = 0;
    let reservations = await biz.collectReservations();
    reservations.forEach(r => total += r.paths.length);

    util.log(`Reservations are collected, total is ${total}`);

    biz.submitReservations(reservations);
}