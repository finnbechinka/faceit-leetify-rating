// ==UserScript==
// @name         FACEIT leetify rating
// @namespace    https://www.faceit.com/
// @version      1.2.1
// @description  A small script that displays leetify ratings on FACEIT
// @author       shaker
// @match        *://*.faceit.com/*
// @match        *://*.leetify.com/*
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
  await get_leetify_at();
  const leetify_access_token = await GM.getValue("leetify_at");
  const leetify_post_options = {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${leetify_access_token}`,
      "Content-Type": "application/json",
    },
  };
  const leetify_get_options = {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${leetify_access_token}`,
    },
  };
  const faceit_get_options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Bearer 976016be-48fb-443e-a4dc-b032c37dc27d",
    },
  };
  let my_elements = [];
  let match_data;
  let ratings;
  let old_url;
  let last_username;
  let last_match_id;

  async function get_leetify_at() {
    if (!(await GM.getValue("leetify_at"))) {
      if (window.location.hostname.split(".").includes("leetify")) {
        await GM.setValue(
          "leetify_at",
          window.localStorage.getItem("access_token")
        );
        if (
          window.location.href ==
          "https://beta.leetify.com/faceit-leetify-rating"
        ) {
          window.close();
        }
      } else {
        window.open("https://beta.leetify.com/faceit-leetify-rating");
      }
    }
  }

  if (!window.localStorage.getItem("faceit-leetify-rating-counted")) {
    fetch("https://shaker-api.netlify.app/.netlify/functions/api", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "1.2.1",
        app: "faceit-leetify-rating",
      }),
    })
      .then((res) => {
        if (res.ok) {
          window.localStorage.setItem("faceit-leetify-rating-counted", "true");
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }

  async function get_leetify_rating(username) {
    let leetify_rating = "NOT FOUND";
    let hltv_rating = "NOT FOUND";
    let games = [];
    let steam_64_id;
    let leetify_user_id;
    try {
      const res_player = await fetch(
        `https://open.faceit.com/data/v4/players?nickname=${username}`,
        faceit_get_options
      );
      if (res_player.ok) {
        const res_player_body = await res_player.json();
        steam_64_id = res_player_body.games.csgo.game_player_id;
      }

      if (steam_64_id) {
        let options = leetify_post_options;
        options.body = `{"searchTerm":"${steam_64_id}"}`;

        const res_search = await fetch(
          "https://api.leetify.com/api/user/search",
          leetify_post_options
        );

        if (res_search.ok) {
          const res_search_body = await res_search.json();
          if (res_search_body.length > 0) {
            leetify_user_id = res_search_body[0].userId;
          }
        }

        if (leetify_user_id) {
          const res_general_data = await fetch(
            `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&dataSources=faceit&spectatingId=${leetify_user_id}`,
            leetify_get_options
          );

          if (res_general_data.ok) {
            const res_general_data_body = await res_general_data.json();
            leetify_rating = (
              res_general_data_body.generalData.current.gamesTotals
                .leetifyRating * 100
            ).toFixed(2);
            hltv_rating =
              res_general_data_body.generalData.current.gamesTotals.hltvRating;
            games = res_general_data_body.generalData.current.games;
          }

          if (leetify_rating == 0.0 && hltv_rating == 0) {
            games = [];
            const res_general_data_alt = await fetch(
              `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&spectatingId=${leetify_user_id}`,
              leetify_get_options
            );

            if (res_general_data.ok) {
              const res_general_data_alt_body =
                await res_general_data_alt.json();
              leetify_rating = (
                res_general_data_alt_body.generalData.current.gamesTotals
                  .leetifyRating * 100
              ).toFixed(2);
              hltv_rating =
                res_general_data_alt_body.generalData.current.gamesTotals
                  .hltvRating;
            }
          }
        } else {
          const res_alternative = await fetch(
            `https://api.leetify.com/api/mini-profiles/${steam_64_id}`,
            leetify_get_options
          );

          if (res_alternative.ok) {
            const res_alternative_body = await res_alternative.json();

            leetify_rating = (
              res_alternative_body.ratings.leetify * 100
            ).toFixed(2);
          }
        }
      }
      return { leetify: leetify_rating, hltv: hltv_rating, games: games };
    } catch (error) {
      console.error(error);
    }
  }

  function add_match_elements(match_data) {
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
          if (e.lastChild && e.lastChild.data == "Kills") {
            const td = e.parentNode;
            const my_td = td.cloneNode(true);
            my_td.lastChild.lastChild.data = "Leetify";
            td.parentNode.insertBefore(my_td, td);
            my_elements.push(my_td);

            const players = td.parentNode.parentNode.nextSibling;
            for (let player of players.childNodes) {
              const name =
                player.firstChild.firstChild.firstChild.lastChild.lastChild
                  .data;
              const my_td2 = player.firstChild.nextSibling.cloneNode(true);
              for (let stats of match_data.playerStats) {
                if (stats.name == name) {
                  const leetify_rating = (stats.leetifyRating * 100).toFixed(2);
                  my_td2.lastChild.lastChild.data = leetify_rating;
                  if (leetify_rating > 2) {
                    my_td2.lastChild.style.color = "#32d35a";
                  }
                  if (leetify_rating < -2) {
                    my_td2.lastChild.style.color = "#ff002b";
                  }
                }
              }
              player.insertBefore(my_td2, player.firstChild.nextSibling);
              my_elements.push(my_td2);
            }
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function get_match_data(match_id) {
    try {
      let steam_64_ids = [];
      const res_match = await fetch(
        `https://open.faceit.com/data/v4/matches/${match_id}`,
        faceit_get_options
      );
      if (res_match.ok) {
        const res_match_body = await res_match.json();

        for (let player of res_match_body.teams.faction1.roster) {
          steam_64_ids.push(player.game_player_id);
        }
        for (let player of res_match_body.teams.faction2.roster) {
          steam_64_ids.push(player.game_player_id);
        }
      }
      if (steam_64_ids) {
        let all_games = [];
        for (let id of steam_64_ids) {
          let leetify_id;

          let options = leetify_post_options;
          options.body = `{"searchTerm":"${id}"}`;

          const res_search = await fetch(
            "https://api.leetify.com/api/user/search",
            options
          );

          if (res_search.ok) {
            const res_search_body = await res_search.json();
            if (res_search_body.length > 0) {
              leetify_id = res_search_body[0].userId;
              const res_history = await fetch(
                `https://api.leetify.com/api/games/history?dataSources=faceit&periods=%7B%22currentPeriod%22%3A%7B%22startDate%22%3A%2201.01.2015%22,%22endDate%22%3A%2201.01.3000%22%7D,%22previousPeriod%22%3A%7B%22startDate%22%3A%2201.10.2014%22,%22endDate%22%3A%2224.12.2014%22%7D%7D&spectatingId=${leetify_id}`,
                leetify_get_options
              );
              if (res_history.ok) {
                const res_history_body = await res_history.json();
                all_games = all_games.concat(res_history_body.games);
              }
            }
          }
        }
        if (all_games.length > 0) {
          for (let game of all_games) {
            if (game.faceitMatchId == match_id) {
              let options = leetify_get_options;
              options.headers.lvid = "d0b5ac8b05023e0cd278ec0c43a83ef2";

              const res_leetify_match = await fetch(
                `https://api.leetify.com/api/games/${game.id}`,
                options
              );
              if (res_leetify_match.ok) {
                const res_leetify_match_body = await res_leetify_match.json();
                return res_leetify_match_body;
              }
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  function remove_my_elements() {
    my_elements.forEach((element) => {
      let parent = element.parentNode;
      if (parent) {
        parent.removeChild(element);
      }
    });
    my_elements = [];
  }

  function add_elements(ratings) {
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
            my_title.firstChild.firstChild.data = "RATINGS (LAST 30 MATCHES)";

            const my_tiles = tiles.cloneNode(true);
            while (my_tiles.childElementCount > 2) {
              my_tiles.removeChild(my_tiles.lastChild);
            }
            if (my_tiles.firstChild.firstChild.firstChild) {
              my_tiles.firstChild.firstChild.firstChild.firstChild.data =
                ratings.leetify;
              my_tiles.firstChild.lastChild.firstChild.firstChild.data =
                "LEETIFY RATING";
              my_tiles.lastChild.firstChild.firstChild.firstChild.data =
                ratings.hltv;
              my_tiles.lastChild.lastChild.firstChild.firstChild.data =
                "HLTV RATING";

              const my_divider = divider.cloneNode(true);

              my_elements.push(my_title);
              my_elements.push(my_tiles);
              my_elements.push(my_divider);

              divider.parentNode.insertBefore(my_title, divider.nextSibling);
              my_title.parentNode.insertBefore(my_tiles, my_title.nextSibling);
              my_tiles.parentNode.insertBefore(
                my_divider,
                my_tiles.nextSibling
              );
            }
          }

          if (
            e.lastChild &&
            e.lastChild.data == "Match History" &&
            ratings.games.length == 30
          ) {
            const table = e.parentNode.nextSibling.firstChild;
            if (table && table.childNodes.length > 0) {
              let games_index = 29;

              for (
                let i = 1;
                i < table.childNodes.length && games_index >= 0;
                i++
              ) {
                const map =
                  table.childNodes[i].childNodes[4].firstChild.lastChild.data;
                if (map == ratings.games[games_index].mapName) {
                  const rating = (
                    ratings.games[games_index].leetifyRating * 100
                  ).toFixed(2);
                  const div = document.createElement("div");
                  if (rating > 2) {
                    div.style.color = "#32d35a";
                  } else if (rating < -2) {
                    div.style.color = "#ff002b";
                  } else {
                    div.style.color = "rgb(255, 255, 255)";
                  }
                  div.style.fontWeight = "normal";
                  div.style.textTransform = "none";
                  const text = document.createTextNode(
                    `Leetify Rating: ${rating}`
                  );
                  div.appendChild(text);

                  table.childNodes[
                    i
                  ].childNodes[2].lastChild.lastChild.parentNode.insertBefore(
                    div,
                    table.childNodes[i].childNodes[2].lastChild.lastChild
                      .nextSibling
                  );
                  if (
                    (table.childNodes[i].childNodes[2].firstChild.firstChild
                      .data.length == 29 &&
                      rating.length == 4) ||
                    (table.childNodes[i].childNodes[2].firstChild.firstChild
                      .data.length == 30 &&
                      rating.length == 5)
                  ) {
                    const str =
                      table.childNodes[i].childNodes[2].firstChild.firstChild
                        .data;
                    const new_str =
                      str.substr(0, 3) + str.substr(str.length - 6, 6);
                    table.childNodes[
                      i
                    ].childNodes[2].firstChild.firstChild.data = new_str;
                  }
                  if (
                    (table.childNodes[i].childNodes[2].firstChild.firstChild
                      .data.length == 30 &&
                      rating.length == 4) ||
                    (table.childNodes[i].childNodes[2].firstChild.firstChild
                      .data.length == 31 &&
                      rating.length == 5)
                  ) {
                    const str =
                      table.childNodes[i].childNodes[2].firstChild.firstChild
                        .data;
                    const new_str =
                      str.substr(0, 4) + str.substr(str.length - 6, 6);
                    table.childNodes[
                      i
                    ].childNodes[2].firstChild.firstChild.data = new_str;
                  }

                  games_index--;
                  my_elements.push(div);
                }
              }
            }
          }
        });
      });
    } catch (error) {
      console.error(error);
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
      const is_match_scoreboard_page =
        url_segments.includes("csgo") &&
        url_segments.includes("room") &&
        url_segments.includes("scoreboard");
      if (is_csgo_stats_page) {
        index = url_segments.indexOf(e) + 1;
        let username = url_segments[index];
        if (username != last_username) {
          last_username = username;
          ratings = await get_leetify_rating(username);
        }
        if (ratings) {
          add_elements(ratings);
        }
      }
      if (is_match_scoreboard_page) {
        const match_id = url_segments[url_segments.length - 2];
        if (last_match_id != match_id) {
          last_match_id = match_id;
          match_data = await get_match_data(match_id);
        }
        if (match_data) {
          add_match_elements(match_data);
        }
      }
    }
  }

  // Select the node that will be observed for mutations
  const targetNode = document.body;

  // Options for the observer (which mutations to observe)
  const config = { attributes: false, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback = async (mutationList, observer) => {
    let current_url = window.location.href;

    if (current_url != old_url) {
      old_url = current_url;
      match_data = undefined;
      remove_my_elements();
      // start();
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  window.onload = () => {
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
    start();
  };

  function start() {
    let update_interval = setInterval(async () => {
      let current_url = window.location.href;
      await update(current_url);
    }, 1000);

    // setTimeout(() => {
    //   clearInterval(update_interval);
    // }, 30000);
  }
})();
