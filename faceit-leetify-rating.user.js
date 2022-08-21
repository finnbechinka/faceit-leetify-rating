// ==UserScript==
// @name         FACEIT leetify rating
// @namespace    https://www.faceit.com/
// @version      0.1.1
// @description  A small script that displays leetify ratings on FACEIT
// @author       shaker
// @match        *://www.faceit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=faceit.com
// @grant        none
// @run-at       document-end
// @homepageURL  https://github.com/shakerrrr/faceit-leetify-rating
// @updateURL    https://github.com/shakerrrr/faceit-leetify-rating/raw/master/faceit-leetify-rating.user.js
// @downloadURL  https://github.com/shakerrrr/faceit-leetify-rating/raw/master/faceit-leetify-rating.user.js
// @supportURL   https://github.com/shakerrrr/faceit-leetify-rating/issues
// ==/UserScript==

(function () {
    "use strict";
    let leetify_rating;
    let hltv_rating;
    async function get_leetify_rating(username) {
        leetify_rating = "NOT FOUND";
        hltv_rating = "NOT FOUND";
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
                    Accept: "application/json, text/plain, */*",
                    "Accept-Language": "en-US,de;q=0.7,en;q=0.3",
                    "Accept-Encoding": "gzip, deflate, br",
                    Authorization:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyMmRmMDUzZC0yMjI0LTRlMjYtYmNlMy0xODc2YjdkMDliZTMiLCJpYXQiOjE2NTkxNzk5MTF9.wjnxKbTd2z3KU9t-TbqmWG4MxhPMUicCb8WQADnrskI",
                    lvid: "c0ffa415093ba1931134cffe769c5529",
                    "Content-Type": "application/json",
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
                    if (response.length > 0) {
                        leetify_user_id = response[0].userId;
                    }
                })
                .catch((err) => console.error(err));
        } else {
            console.log("no steam 64 id");
        }

        if (leetify_user_id) {
            options = {
                method: "GET",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Accept-Language": "en-US,de;q=0.7,en;q=0.3",
                    "Accept-Encoding": "gzip, deflate, br",
                    Authorization:
                        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIyMmRmMDUzZC0yMjI0LTRlMjYtYmNlMy0xODc2YjdkMDliZTMiLCJpYXQiOjE2NTkxNzk5MTF9.wjnxKbTd2z3KU9t-TbqmWG4MxhPMUicCb8WQADnrskI",
                    lvid: "d0b5ac8b05023e0cd278ec0c43a83ef2",
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
                .then((response) => {
                    leetify_rating =
                        response.generalData.current.gamesTotals.leetifyRating *
                        100;
                    hltv_rating =
                        response.generalData.current.gamesTotals.hltvRating;
                    console.log(`lr: ${leetify_rating}\nhltv: ${hltv_rating}`);
                })
                .catch((err) => console.error(err));
        } else {
            console.log("no leetify user id");
        }
    }

    async function update(url) {
        const url_segments = url.split("/");
        let index;
        url_segments.forEach((element) => {
            if (["players", "players-modal"].includes(element)) {
                index = url_segments.indexOf(element) + 1;
            }
        });
        await get_leetify_rating(url_segments[index]);
    }

    let my_elements = [];

    function remove_my_elements() {
        my_elements.forEach((element) => {
            let parent = element.parentNode;
            if (parent) {
                parent.removeChild(element);
            }
        });
        my_elements = [];
    }

    function add_elements() {
        if (my_elements.length != 0) {
            remove_my_elements();
        }
        // find the shadow root(s) (very cringe)
        const shadows = Array.from(document.querySelectorAll("*"))
            .map((el) => el.shadowRoot)
            .filter(Boolean);
        shadows.forEach((s) => {
            let elements = s.querySelectorAll("span");
            elements.forEach((e) => {
                if (e.lastChild && e.lastChild.data == "Main Statistics") {
                    const title = e.parentNode;
                    const tiles = title.nextSibling;
                    const divider = tiles.nextSibling;

                    const my_title = title.cloneNode(true);
                    my_title.firstChild.firstChild.data =
                        "RATINGS (LAST 30 MATCHES)";

                    const my_tiles = tiles.cloneNode(true);
                    while (my_tiles.childElementCount > 2) {
                        my_tiles.removeChild(my_tiles.lastChild);
                    }
                    my_tiles.firstChild.firstChild.firstChild.firstChild.data =
                        leetify_rating;
                    my_tiles.firstChild.lastChild.firstChild.firstChild.data =
                        "LEETIFY RATING";
                    my_tiles.lastChild.firstChild.firstChild.firstChild.data =
                        hltv_rating;
                    my_tiles.lastChild.lastChild.firstChild.firstChild.data =
                        "HLTV RATING";

                    const my_divider = divider.cloneNode(true);

                    my_elements.push(my_title);
                    my_elements.push(my_tiles);
                    my_elements.push(my_divider);

                    divider.parentNode.insertBefore(
                        my_title,
                        divider.nextSibling
                    );
                    my_title.parentNode.insertBefore(
                        my_tiles,
                        my_title.nextSibling
                    );
                    my_tiles.parentNode.insertBefore(
                        my_divider,
                        my_tiles.nextSibling
                    );
                }
            });
        });
    }

    // Select the node that will be observed for mutations
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    let old_url;

    // Callback function to execute when mutations are observed
    const callback = async (mutationList, observer) => {
        let current_url = window.location.href;

        if (current_url != old_url) {
            old_url = current_url;
            remove_my_elements();
            await update(current_url);
        }
        add_elements();
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
})();
