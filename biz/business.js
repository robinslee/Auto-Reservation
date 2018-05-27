"use strict";

const fs = require("fs");
const { URL } = require("url");

const cheerio = require("cheerio");
const asyncRequest = require("async-http-request");

const util = require("./util");
const recognizeImage = require("./ocr-image");

const {
    url_doctor_list:    URL_DOC_LIST,
    url_verify_code:    URL_GET_VERIFY_CODE,
    form_data_template: FORM_DATE_TEMPLATE,
    temp_ocr_img_dir:   TEMP_FOLDER,
    url_base:           URL_BASE,
    verify_codes:       VERIFY_CODE,
    failure_response_msg: {
        RESP_USED,
        RESP_CODE_INVALID,
        RESP_OVER_TIME,
        RESP_NEED_LOGIN
    }
} = global.CONFIG;

/**
 * Get all available reservation links
 * 
 * @returns {Array}
 */
async function collectReservations() {
    let docUrls = URL_DOC_LIST;
    let reservations = [];

    for (let url of docUrls) {
        let ua = util.getRandomUA();
        let html = await asyncRequest.get({url, headers: {
            "User-Agent": ua
        }});
        let $ = cheerio.load(html);

        $("div[class*=ys_list]").each((i, el) => {
            let $el = $(el);

            let docName = $el.find(".ys_js dt .f_b").text();
            let paths = [];
            $el.find(".yysj dt .f_float a").each((j, a) => {
                paths.push($(a).attr("href"));
            });
            reservations.push({
                docName, paths
            });
        });
    }
    return reservations;
}

/**
 * Submit reservation requests one by one
 * 
 * @description 
 * @param {Array} reservations Available reservation list that collected
 */
async function submitReservations(reservations = []) {
    let _formData = FORM_DATE_TEMPLATE;

    for (let reservation of reservations) {
        let { docName, paths } = reservation;

        for (let path of paths) {
            let url = new URL(URL_BASE + path);
            let oSearchParam = url.searchParams;
            let verifyCode = VERIFY_CODE[VERIFY_CODE.length - 1];
            let date = oSearchParam.get("PBRQ");
            let time = oSearchParam.get("Time");

            let params = {
                PeriodId: oSearchParam.get("PeriodId"),
                docID: oSearchParam.get("YSDM"),
                MapId: oSearchParam.get("YSDM"),
                deptId: oSearchParam.get("KSDM"),
                DeptName: oSearchParam.get("KSMC"),
                Time: time,
                MZSJ: date,
                RegDate: date,
                yzm: verifyCode,
                DoctorName: docName,
                "button.x": Math.floor(Math.random() * 209),
                "button.y": Math.floor(Math.random() * 45)
            };

            let formData = Object.assign({}, _formData, params);
            let body = await util.sendReserveRequest(formData, url.toString());

            if (body.includes(RESP_USED)) {
                util.log(`[${docName}] has NO TIME at [${params.RegDate} ${params.Time}]`);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 800));

            } else if (body.includes(RESP_CODE_INVALID)) {
                util.log("Verify code is INCORRECT, trying load new one ... ...");

                let code = await refreshVerifyCode();
                VERIFY_CODE.push(code);

                util.log(`Verify code is ${VERIFY_CODE}`);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 800));

            } else if (body.includes(RESP_OVER_TIME)) {
                util.log(`[${params.RegDate} ${params.Time}] is INVALID`);
                await new Promise(resolve => setTimeout(resolve, Math.random() * 800));

            } else if (body.includes(RESP_NEED_LOGIN)) {
                util.log(`Please sign in your account in browser first`);
                process.exit();

            } else {
                util.log(`Congrats!!! You successfully reserve a doctor [${docName}] at [${params.RegDate} ${params.Time}]`);
                process.exit();

            }
        }
    }
    util.log(`Pitty!!! You can't reserve any doctors, you may try another hospital`);
}

/**
 * Get a new verify code and do a OCR RECOGNIZE
 * 
 * @returns {Promise} resolve with text that tesseract-ocr recognized out
 */
async function refreshVerifyCode() {
    let oRequest = await util.execRequest({
        url: URL_GET_VERIFY_CODE,
        resolveWithRequest: true
    });

    if (!fs.statSync(TEMP_FOLDER).isDirectory()) {
        fs.mkdirSync(TEMP_FOLDER);
    }
    return recognizeImage(oRequest);
}

module.exports = {
    collectReservations,
    submitReservations,
    refreshVerifyCode
}