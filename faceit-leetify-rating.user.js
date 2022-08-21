// ==UserScript==
// @name         FACEIT leetify rating
// @namespace    https://www.faceit.com/
// @version      0.1.0
// @description  A small script that displays leetify ratings on FACEIT
// @author       shaker
// @match        *://www.faceit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=faceit.com
// @grant        none
// @run-at       document-end
// @homepageURL  https://github.com/shakerrrr/
// ==/UserScript==

(function () {
    "use strict";

    async function get_leetify_rating(username) {
        let steam_64_id;
        let leetify_user_id;
        let options = {
            method: "GET",
            headers: {
                cookie: "__cf_bm=avF3h9RIT5kjpEh17Z7P1W2Rhs9DcBHJCVtGd5qNR1U-1661058565-0-AcC3JgaL6nN0O5Qc9rMfglt%2FX5DAI813G9zPRstr55AwVOjvOzp%2Bdeov926ilJV5McXtpRCO%2BvuI8o6KRWTRaoY%3D; __cfruid=5f7c8c1f05ecc68841b24e5d3f0dac2c2385dde5-1661058565",
                accept: "application/json",
                Authorization: "Bearer 976016be-48fb-443e-a4dc-b032c37dc27d",
            },
        };

        await fetch(
            `https://open.faceit.com/data/v4/players?nickname=${username}`,
            options
        )
            .then((response) => response.json())
            .then((response) => {
                steam_64_id = response.games.csgo.game_player_id;
            })
            .catch((err) => console.error(err));

        if (steam_64_id) {
            options = {
                method: "POST",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
                    Accept: "application/json, text/plain, */*",
                    "Accept-Language": "en-US,de;q=0.7,en;q=0.3",
                    "Accept-Encoding": "gzip, deflate, br",
                    Authorization:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyMmRmMDUzZC0yMjI0LTRlMjYtYmNlMy0xODc2YjdkMDliZTMiLCJpYXQiOjE2NTkxNzk5MTF9.wjnxKbTd2z3KU9t-TbqmWG4MxhPMUicCb8WQADnrskI",
                    lvid: "c0ffa415093ba1931134cffe769c5529",
                    "Content-Type": "application/json",
                    Origin: "https://beta.leetify.com",
                    DNT: "1",
                    Connection: "keep-alive",
                    Referer: "https://beta.leetify.com/",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site",
                    TE: "trailers",
                },
                body: `{"searchTerm":"${steam_64_id}"}`,
            };

            await fetch("https://api.leetify.com/api/user/search", options)
                .then((response) => response.json())
                .then((response) => {
                    leetify_user_id = response[0].userId;
                })
                .catch((err) => console.error(err));
        } else {
            console.log("no steam 64 id");
        }

        if (leetify_user_id) {
            options = {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
                    Accept: "application/json, text/plain, */*",
                    "Accept-Language": "en-US,de;q=0.7,en;q=0.3",
                    "Accept-Encoding": "gzip, deflate, br",
                    Authorization:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyMmRmMDUzZC0yMjI0LTRlMjYtYmNlMy0xODc2YjdkMDliZTMiLCJpYXQiOjE2NTkxNzk5MTF9.wjnxKbTd2z3KU9t-TbqmWG4MxhPMUicCb8WQADnrskI",
                    lvid: "d0b5ac8b05023e0cd278ec0c43a83ef2",
                    Origin: "https://beta.leetify.com",
                    DNT: "1",
                    Connection: "keep-alive",
                    Referer: "https://beta.leetify.com/",
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-site",
                    TE: "trailers",
                },
            };

            await fetch(
                `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&spectatingId=${leetify_user_id}`,
                options
            )
                .then((response) => response.json())
                .then((response) =>
                    console.log(
                        response.generalData.current.gamesTotals.leetifyRating *
                            100
                    )
                )
                .catch((err) => console.error(err));
        } else {
            console.log("no leetify user id");
        }
    }

    function update() {
        const current_url = window.location.href;

        if (current_url.includes("/players-modal/")) {
            let user_name =
                current_url.split("/")[current_url.split("/").length - 1];
            get_leetify_rating(user_name);
        }

        if (current_url.includes("/players/")) {
            let user_name =
                current_url.split("/")[current_url.split("/").length - 1];
            get_leetify_rating(user_name);
        }
    }

    // Select the node that will be observed for mutations
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    let old_url;

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
        const current_url = window.location.href;

        if (current_url != old_url) {
            old_url = current_url;
            update();
        }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);

    update();
})();
