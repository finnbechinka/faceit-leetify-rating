// ==UserScript==
// @name         FACEIT leetify rating
// @namespace    https://www.faceit.com/
// @version      1.6.3
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
  if (!window.localStorage.getItem("faceit-leetify-rating-counted")) {
    fetch("https://shaker-api.netlify.app/.netlify/functions/api", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "1.6.0",
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

  const leetify_access_token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkMjI2ZjA4Ny1mNjZjLTQ4M2MtYTMyMi1lMzE4NjEzMzVlMjMiLCJpYXQiOjE2NjE5OTIyMDZ9.N118a-3ZGb5nkgVo1ibgbbc2Sv1mHlJfc9D70nuX1_I";
  const lvid = "d0b5ac8b05023e0cd278ec0c43a83ef2";

  const leetify_post_options = {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${leetify_access_token}`,
      lvid: lvid,
      "Content-Type": "application/json",
    },
  };
  const leetify_get_options = {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      Authorization: `Bearer ${leetify_access_token}`,
      lvid: lvid,
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
  let old_url;

  const data = {
    game_version: undefined,
    leetify_rating: "LOADING",
    hltv_rating: "LOADING",
    adr: "LOADING",
    games: [],
    last_username: undefined,
    match_data: undefined,
    last_match_id: undefined,
    not_found_obj: {
      leetify: "NOT FOUND",
      hltv: "NOT FOUND",
      adr: "NOT FOUND",
      games: [],
    },
    async get_leetify_rating_fallback(steam_64_id) {
      const res_alternative = await fetch(
        `https://api.leetify.com/api/mini-profiles/${steam_64_id}`,
        leetify_get_options
      );

      if (!res_alternative.ok) return this.not_found_obj;

      const res_alternative_body = await res_alternative.json();

      this.leetify_rating = (res_alternative_body.ratings.leetify * 100).toFixed(2);
      this.hltv_rating = "NOT FOUND";
      this.adr = "NOT FOUND";
      this.games = [];

      return {
        leetify: this.leetify_rating,
        hltv: this.hltv_rating,
        adr: this.adr,
        games: this.games,
      };
    },
    async get_leetify_rating(username) {
      if (username == this.last_username) {
        return {
          leetify: this.leetify_rating,
          hltv: this.hltv_rating,
          adr: this.adr,
          games: this.games,
        };
      }
      this.last_username = username;
      this.leetify_rating = "LOADING";
      this.hltv_rating = "LOADING";
      this.adr = "LOADING";
      this.games = [];
      let steam_64_id;
      let leetify_user_id;

      const res_player = await fetch(
        `https://open.faceit.com/data/v4/players?nickname=${username}`,
        faceit_get_options
      );

      if (!res_player.ok) return this.not_found_obj;

      const res_player_body = await res_player.json();
      if (this.game_version == "cs2") steam_64_id = res_player_body.games.cs2.game_player_id;
      if (this.game_version == "csgo") steam_64_id = res_player_body.games.csgo.game_player_id;

      if (!steam_64_id) return this.not_found_obj;

      let options = leetify_post_options;
      options.body = `{"query":"${steam_64_id}"}`;

      const res_search = await fetch(
        "https://api.leetify.com/api/search/users",
        leetify_post_options
      );

      if (!res_search.ok) return this.not_found_obj;

      const res_search_body = await res_search.json();
      if (res_search_body.length > 0) {
        leetify_user_id = res_search_body[0].userId;
      }

      if (!leetify_user_id) return await this.get_leetify_rating_fallback(steam_64_id);

      const res_general_data = await fetch(
        `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&dataSources=faceit&gameVersions=${this.game_version}&spectatingId=${leetify_user_id}`,
        leetify_get_options
      );

      if (!res_general_data.ok) return await this.get_leetify_rating_fallback(steam_64_id);

      const res_general_data_body = await res_general_data.json();
      this.leetify_rating = (
        res_general_data_body.generalData.current.gamesTotals.leetifyRating * 100
      ).toFixed(2);
      this.hltv_rating = res_general_data_body.generalData.current.gamesTotals.hltvRating;
      this.games = res_general_data_body.generalData.current.games;
      this.adr = Math.round(res_general_data_body.generalData.current.gamesTotals.adr);

      if (data.leetify_rating == 0 && data.hltv_rating == 0) {
        this.games = [];
        const res_general_data_alt = await fetch(
          `https://api.leetify.com/api/general-data?side=null&roundEconomyType=null&gameVersions=${this.game_version}&spectatingId=${leetify_user_id}`,
          leetify_get_options
        );

        if (!res_general_data_alt.ok) return await this.get_leetify_rating_fallback(steam_64_id);

        const res_general_data_alt_body = await res_general_data_alt.json();
        this.leetify_rating = (
          res_general_data_alt_body.generalData.current.gamesTotals.leetifyRating * 100
        ).toFixed(2);
        this.hltv_rating = res_general_data_alt_body.generalData.current.gamesTotals.hltvRating;
        this.adr = Math.round(res_general_data_alt_body.generalData.current.gamesTotals.adr);
      }

      return {
        leetify: this.leetify_rating,
        hltv: this.hltv_rating,
        adr: this.adr,
        games: this.games,
      };
    },
    async get_match_data(match_id) {
      if (match_id == this.last_match_id) {
        return this.match_data;
      }
      this.last_match_id = match_id;
      let steam_64_ids = [];
      const res_match = await fetch(
        `https://open.faceit.com/data/v4/matches/${match_id}`,
        faceit_get_options
      );
      if (!res_match.ok) return undefined;

      const res_match_body = await res_match.json();

      for (let player of res_match_body.teams.faction1.roster) {
        steam_64_ids.push(player.game_player_id);
      }
      for (let player of res_match_body.teams.faction2.roster) {
        steam_64_ids.push(player.game_player_id);
      }

      if (!steam_64_ids) return undefined;

      for (let id of steam_64_ids) {
        let options = leetify_post_options;
        options.body = `{"query":"${id}"}`;

        const res_search = await fetch("https://api.leetify.com/api/search/users", options);

        const res_search_body = await res_search.json();

        if (!res_search.ok) continue;
        if (res_search_body.length <= 0) continue;

        const leetify_id = res_search_body[0].userId;
        const res_history = await fetch(
          `https://api.leetify.com/api/games/history?dataSources=faceit&periods=%7B%22currentPeriod%22%3A%7B%22startDate%22%3A%2201.01.2015%22,%22endDate%22%3A%2201.01.3000%22%7D,%22previousPeriod%22%3A%7B%22startDate%22%3A%2201.10.2014%22,%22endDate%22%3A%2224.12.2014%22%7D%7D&spectatingId=${leetify_id}`,
          leetify_get_options
        );

        if (!res_history.ok) continue;

        const res_history_body = await res_history.json();

        if (res_history_body.games.length <= 0) continue;

        for (let game of res_history_body.games) {
          if (game.faceitMatchId == match_id) {
            let options = leetify_get_options;

            const res_leetify_match = await fetch(
              `https://api.leetify.com/api/games/${game.id}`,
              options
            );

            if (!res_leetify_match.ok) return undefined;

            const res_leetify_match_body = await res_leetify_match.json();
            this.match_data = res_leetify_match_body;
            return this.match_data;
          }
        }
      }
    },
  };

  function remove_my_elements() {
    my_elements.forEach((element) => {
      let parent = element.parentNode;
      if (parent) {
        parent.removeChild(element);
      }
    });
    my_elements = [];
  }

  function add_match_elements(match_data) {
    if (!match_data) {
      return;
    }
    if (my_elements.length != 0) {
      remove_my_elements();
    }
    let elements = document.querySelectorAll("span");
    elements.forEach((e) => {
      if (!e.lastChild || e.lastChild.data != "Kills") {
        return;
      }
      const td = e.parentNode;
      const my_td = td.cloneNode(true);
      my_td.lastChild.lastChild.data = "Leetify";
      td.parentNode.insertBefore(my_td, td);
      my_elements.push(my_td);

      const players = td.parentNode.parentNode.nextSibling;
      for (let player of players.childNodes) {
        for (let stats of match_data.playerStats) {
          const name = player.firstChild.firstChild.firstChild.lastChild.firstChild.innerText;
          if (stats.name == name) {
            const my_td2 = player.firstChild.nextSibling.cloneNode(true);
            const leetify_rating = (stats.leetifyRating * 100).toFixed(2);
            const match_link = `https://leetify.com/app/match-details/${match_data.id}`;
            my_td2.lastChild.innerHTML = `<a href="${match_link}" target="_blank">${leetify_rating}</a>`;
            my_td2.lastChild.lastChild.style.color = "#FFFFFF";
            if (leetify_rating > 2) my_td2.lastChild.lastChild.style.color = "#32d35a";
            if (leetify_rating < -2) my_td2.lastChild.lastChild.style.color = "#ff002b";
            player.insertBefore(my_td2, player.firstChild.nextSibling);
            my_elements.push(my_td2);
          }
        }
      }
    });
  }

  function add_match_history_ratings(e, ratings) {
    const table = e.parentNode.nextSibling.firstChild;
    if (table && table.childNodes.length > 0) {
      let games_index = ratings.games.length - 1;

      for (let i = 1; i < table.childNodes.length && games_index >= 0; i++) {
        const map = table.childNodes[i].childNodes[4].firstChild.lastChild.data;
        if (map == ratings.games[games_index].mapName) {
          const rating = (ratings.games[games_index].leetifyRating * 100).toFixed(2);
          const div = document.createElement("div");
          if (rating > 2) div.style.color = "#32d35a";
          else if (rating < -2) div.style.color = "#ff002b";
          else div.style.color = "rgb(255, 255, 255)";

          div.style.fontWeight = "normal";
          div.style.textTransform = "none";
          const text = document.createTextNode(`Leetify Rating: ${rating}`);
          div.appendChild(text);

          table.childNodes[i].childNodes[2].lastChild.lastChild.parentNode.insertBefore(
            div,
            table.childNodes[i].childNodes[2].lastChild.lastChild.nextSibling
          );
          if (
            (table.childNodes[i].childNodes[2].firstChild.firstChild.data.length == 29 &&
              rating.length == 4) ||
            (table.childNodes[i].childNodes[2].firstChild.firstChild.data.length == 30 &&
              rating.length == 5)
          ) {
            const str = table.childNodes[i].childNodes[2].firstChild.firstChild.data;
            const new_str = str.substr(0, 3) + str.substr(str.length - 6, 6);
            table.childNodes[i].childNodes[2].firstChild.firstChild.data = new_str;
          }
          if (
            (table.childNodes[i].childNodes[2].firstChild.firstChild.data.length == 30 &&
              rating.length == 4) ||
            (table.childNodes[i].childNodes[2].firstChild.firstChild.data.length == 31 &&
              rating.length == 5)
          ) {
            const str = table.childNodes[i].childNodes[2].firstChild.firstChild.data;
            const new_str = str.substr(0, 4) + str.substr(str.length - 6, 6);
            table.childNodes[i].childNodes[2].firstChild.firstChild.data = new_str;
          }

          games_index--;
          my_elements.push(div);
        }
      }
    }
  }

  function add_profile_ratings(e, ratings) {
    const title = e.parentNode;
    const tiles = title.nextSibling;
    const divider = tiles.nextSibling;

    const my_title = title.cloneNode(true);
    my_title.firstChild.firstChild.data = "RATINGS (LAST 30 MATCHES)";

    const my_tiles = tiles.cloneNode(true);
    while (my_tiles.childElementCount > 3) {
      my_tiles.removeChild(my_tiles.lastChild);
    }
    if (my_tiles.firstChild.firstChild.firstChild) {
      my_tiles.children[0].firstChild.firstChild.firstChild.data = ratings.leetify;
      my_tiles.children[0].lastChild.firstChild.firstChild.data = "LEETIFY RATING";
      my_tiles.children[1].firstChild.firstChild.firstChild.data = ratings.hltv;
      my_tiles.children[1].lastChild.firstChild.firstChild.data = "HLTV RATING";
      my_tiles.children[2].firstChild.firstChild.firstChild.data = ratings.adr;
      my_tiles.children[2].lastChild.firstChild.firstChild.data = "ADR";

      const my_divider = divider.cloneNode(true);

      my_elements.push(my_title);
      my_elements.push(my_tiles);
      my_elements.push(my_divider);

      divider.parentNode.insertBefore(my_title, divider.nextSibling);
      my_title.parentNode.insertBefore(my_tiles, my_title.nextSibling);
      my_tiles.parentNode.insertBefore(my_divider, my_tiles.nextSibling);
    }
  }

  function add_elements(ratings) {
    if (!ratings) {
      return;
    }
    if (my_elements.length != 0) {
      remove_my_elements();
    }
    let elements = document.querySelectorAll("span");
    elements.forEach((e) => {
      if (e.lastChild && e.lastChild.data == "Main Statistics") {
        add_profile_ratings(e, ratings);
      }

      if (e.lastChild && e.lastChild.data == "Match History" && ratings.games.length == 30) {
        add_match_history_ratings(e, ratings);
      }
    });
  }

  async function update(url) {
    try {
      const url_segments = url.split("/");
      let index;

      const is_stats_page =
        (url_segments.includes("players") || url_segments.includes("players-modal")) &&
        url_segments.includes("stats");

      const is_match_scoreboard_page =
        url_segments.includes("room") && url_segments.includes("scoreboard");

      const is_csgo = url_segments.includes("csgo");
      const is_cs2 = url_segments.includes("cs2");

      if (is_csgo) {
        data.game_version = "csgo";
      } else if (is_cs2) {
        data.game_version = "cs2";
      }

      if (is_stats_page) {
        const username = url_segments[5];
        const ratings = await data.get_leetify_rating(username);
        add_elements(ratings);
      }

      if (is_match_scoreboard_page) {
        const match_id = url_segments[url_segments.length - 2];
        const match_data = await data.get_match_data(match_id);
        add_match_elements(match_data);
      }
    } catch (error) {
      console.error(error);
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
      remove_my_elements();
    }
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  window.onload = () => {
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
    let update_interval = setInterval(async () => {
      let current_url = window.location.href;
      await update(current_url);
    }, 1000);

    // setTimeout(() => {
    //   clearInterval(update_interval);
    // }, 30000);
  };
})();
