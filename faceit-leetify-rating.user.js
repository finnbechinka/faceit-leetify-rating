// ==UserScript==
// @name         FACEIT leetify rating
// @namespace    https://www.faceit.com/
// @version      0.4.0
// @description  A small script that displays leetify ratings on FACEIT
// @author       shaker
// @match        *://www.faceit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=faceit.com
// @grant        GM.getValue
// @grant        GM.setValue
// @run-at       document-end
// @homepageURL  https://github.com/shakerrrr/faceit-leetify-rating
// @updateURL    https://github.com/shakerrrr/faceit-leetify-rating/raw/master/faceit-leetify-rating.user.js
// @downloadURL  https://github.com/shakerrrr/faceit-leetify-rating/raw/master/faceit-leetify-rating.user.js
// @supportURL   https://github.com/shakerrrr/faceit-leetify-rating/issues
// ==/UserScript==

(async function () {
    "use strict";

    if (window.location.hostname.split(".").includes("leetify")) {
        await GM.setValue(
            "leetify_at",
            window.localStorage.getItem("access_token")
        );
    }

    const leetify_access_token = await GM.getValue("leetify_at");

    if (!window.localStorage.getItem("faceit-leetify-rating-counted")) {
        fetch("https://shaker-api.netlify.app/.netlify/functions/api", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "0.4.0",
                app: "faceit-leetify-rating",
            }),
        })
            .then((res) => {
                if (res.ok) {
                    window.localStorage.setItem(
                        "faceit-leetify-rating-counted",
                        "true"
                    );
                }
            })
            .catch((e) => {
                console.error(e);
            });
    }

    let leetify_rating;
    let hltv_rating;
    let games;
    async function get_leetify_rating(username) {
        leetify_rating = "NOT FOUND";
        hltv_rating = "NOT FOUND";
        games = [];
        let steam_64_id;
        let leetify_user_id;
        try {
            let options = {
                method: "GET",
                headers: {
                    accept: "application/json",
                    Authorization:
                        "Bearer 976016be-48fb-443e-a4dc-b032c37dc27d",
                },
            };

            const res_player = await fetch(
                `https://open.faceit.com/data/v4/players?nickname=${username}`,
                options
            );
            const res_player_body = await res_player.json();
            if (res_player.ok) {
                steam_64_id = res_player_body.games.csgo.game_player_id;
            }

            if (steam_64_id) {
                options = {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        Authorization: `Bearer ${leetify_access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: `{"searchTerm":"${steam_64_id}"}`,
                };

                const res_search = await fetch(
                    "https://api.leetify.com/api/user/search",
                    options
                );
                const res_search_body = await res_search.json();

                if (res_search.ok) {
                    if (res_search_body.length > 0) {
                        leetify_user_id = res_search_body[0].userId;
                    }
                }

                if (leetify_user_id) {
                    // options = {
                    //     method: "GET",
                    //     headers: {
                    //         Accept: "application/json, text/plain, */*",
                    //         Authorization: `Bearer ${leetify_access_token}`,
                    //     },
                    // };

                    // const res_history = await fetch(
                    //     `https://api.leetify.com/api/games/history?dataSources=faceit&spectatingId=${leetify_user_id}`,
                    //     options
                    // );

                    // const res_history_body = await res_history.json();

                    // if (res_history.ok) {
                    //     games = res_history_body.games;
                    //     console.log(games);
                    // }

                    options = {
                        method: "GET",
                        headers: {
                            Accept: "application/json, text/plain, */*",
                            Authorization: `Bearer ${leetify_access_token}`,
                        },
                    };

                    const res_general_data = await fetch(
                        `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&dataSources=faceit&spectatingId=${leetify_user_id}`,
                        options
                    );
                    const res_general_data_body = await res_general_data.json();

                    if (res_general_data.ok) {
                        leetify_rating = (
                            res_general_data_body.generalData.current
                                .gamesTotals.leetifyRating * 100
                        ).toFixed(2);
                        hltv_rating =
                            res_general_data_body.generalData.current
                                .gamesTotals.hltvRating;
                        games = res_general_data_body.generalData.current.games;
                    }

                    if (leetify_rating == 0.0 && hltv_rating == 0) {
                        games = [];

                        options = {
                            method: "GET",
                            headers: {
                                Accept: "application/json, text/plain, */*",
                                Authorization: `Bearer ${leetify_access_token}`,
                            },
                        };

                        const res_general_data_alt = await fetch(
                            `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&spectatingId=${leetify_user_id}`,
                            options
                        );
                        const res_general_data_alt_body =
                            await res_general_data_alt.json();

                        if (res_general_data.ok) {
                            leetify_rating = (
                                res_general_data_alt_body.generalData.current
                                    .gamesTotals.leetifyRating * 100
                            ).toFixed(2);
                            hltv_rating =
                                res_general_data_alt_body.generalData.current
                                    .gamesTotals.hltvRating;
                        }
                    }
                } else {
                    console.log("no leetify user id");

                    options = {
                        method: "GET",
                        headers: {
                            Accept: "application/json, text/plain, */*",
                            Authorization: `Bearer ${leetify_access_token}`,
                        },
                    };

                    const res_alternative = await fetch(
                        `https://api.leetify.com/api/mini-profiles/${steam_64_id}`,
                        options
                    );

                    const res_alternative_body = await res_alternative.json();

                    if (res_alternative.ok) {
                        leetify_rating = (
                            res_alternative_body.ratings.leetify * 100
                        ).toFixed(2);
                    }
                }
            } else {
                console.log("no steam 64 id");
            }
            console.log(
                `lr: ${leetify_rating}\nhltv: ${hltv_rating}\ngames: ${games.length}`
            );
        } catch (error) {
            console.log(error);
        }
    }

    async function update(url) {
        const url_segments = url.split("/");
        let index;

        for (let e of url_segments) {
            const is_csgo_stats_page =
                ["players", "players-modal"].includes(e) &&
                url_segments.includes("stats") &&
                url_segments.includes("csgo");
            if (is_csgo_stats_page) {
                index = url_segments.indexOf(e) + 1;
                await get_leetify_rating(url_segments[index]);
                add_elements();
            }
        }
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
        try {
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

                    if (e.lastChild && e.lastChild.data == "Match History") {
                        const table = e.parentNode.nextSibling.firstChild;
                        if (table) {
                            for (let i = 1; i < table.childNodes.length; i++) {
                                /*
                                table.childNodes[
                                    i
                                ].firstChild.lastChild.lastChild.data =
                                    games[games.length - i].finishedAt;
                                */
                            }
                        }
                    }
                });
            });
        } catch (error) {
            console.log(error);
        }
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
        }

        if (my_elements.length < 3) {
            await update(current_url);
        }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
})();
