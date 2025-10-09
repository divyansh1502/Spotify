// script.js (replace your current file with this)

// --- utility ---
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(file = "./songs.json") {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
    return await res.json();
}

// --- globals ---
let songs = [];
let currentIndex = 0;
const audio = new Audio();
const playP = document.getElementById("playP");

// --- UI update helpers ---
function updatePlayIcons() {
    // reset per-row icons
    document.querySelectorAll(".play1 i").forEach(icon => {
        icon.className = "ri-play-large-fill";
    });

    const listItems = document.querySelectorAll(".song-list li");
    // If list exists and currentIndex points to a valid li, update its icon
    if (listItems.length > 0 && listItems[currentIndex]) {
        const icon = listItems[currentIndex].querySelector(".play1 i");
        if (icon) {
            // if the audio.dataset.track matches the row's track (best-effort) then toggle icon
            const rowTrack = songs[currentIndex];
            const playingTrack = audio.dataset.track;
            if (playingTrack && decodeURI(playingTrack) === decodeURI(rowTrack)) {
                icon.className = audio.paused ? "ri-play-large-fill" : "ri-pause-large-fill";
            } else {
                // show play icon for rows that are not the current playing track
                icon.className = "ri-play-large-fill";
            }
        }
    }

    // update global play button
    if (audio.src && !audio.paused) {
        playP.innerHTML = `<i class="ri-pause-large-line"></i>`;
    } else {
        playP.innerHTML = `<i class="ri-play-large-fill"></i>`;
    }
}

function populateSongList() {
    const songUL = document.querySelector(".song-list ul");
    if (!songUL) return;
    let html = "";
    songs.forEach((song, i) => {
        html += `<li data-index="${i}">
            <div class="info">
              <div class="music"><i class="ri-music-fill"></i></div>
              <div class="song-info">
                <div class="song-title">${song.replaceAll("%20", " ")}</div>
                <div class="singer">Divyansh Singh</div>
              </div>
            </div>
            <div class="play1"><i class="ri-play-large-fill"></i></div>
        </li>`;
    });
    songUL.innerHTML = html;

    // attach listeners to each row to play that song when clicked
    Array.from(songUL.getElementsByTagName("li")).forEach((li, i) => {
        li.addEventListener("click", () => {
            const idx = Number(li.dataset.index);
            currentIndex = idx;
            playMusic(songs[currentIndex], currentIndex);
        });
    });

    updatePlayIcons();
}

// playMusic loads and attempts to play the given track
async function playMusic(track, index = null) {
    if (!track) return;
    const songPath = "./songs/" + encodeURI(track);
    audio.dataset.track = track;

    // If this call came from a row click we set the audio src to selected track (and play).
    // If the audio is already playing another file and this function is called programmatically with index === null
    // then we try to resolve index but don't change src unless explicitly asked.
    if (index !== null) {
        audio.src = songPath;
    } else {
        const idx = songs.indexOf(track);
        if (idx !== -1) currentIndex = idx;
    }

    if (index !== null) currentIndex = index;

    const titleEl = document.querySelector(".playbar-container .song-info1");
    if (titleEl) titleEl.textContent = track.replaceAll("%20", " ");

    const timeEl = document.querySelector(".song-time");
    if (timeEl) timeEl.textContent = `00:00 / 00:00`;

    try {
        // attempt to play only if we set the src (i.e., user clicked a song row or called explicitly)
        if (index !== null) {
            await audio.play();
        }
    } catch (err) {
        console.warn("play() blocked or failed:", err);
    }

    updatePlayIcons();
}

// --- audio events ---
audio.addEventListener("timeupdate", () => {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    const cur = isFinite(audio.currentTime) ? audio.currentTime : 0;
    const timeEl = document.querySelector(".song-time");
    if (timeEl) timeEl.textContent = `${secondsToMinutesSeconds(cur)} / ${secondsToMinutesSeconds(dur)}`;
    const circle = document.querySelector(".circle");
    if (circle) {
        circle.style.left = dur > 0 ? (cur / dur) * 100 + "%" : "0%";
    }
});

audio.addEventListener("loadedmetadata", () => {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    const timeEl = document.querySelector(".song-time");
    if (timeEl) timeEl.textContent = `${secondsToMinutesSeconds(audio.currentTime)} / ${secondsToMinutesSeconds(dur)}`;
});

audio.addEventListener("ended", () => {
    if (!songs || songs.length === 0) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
});

// --- seekbar ---
const seekbar = document.querySelector(".seekbar");
if (seekbar) {
    seekbar.addEventListener("click", (e) => {
        const rect = seekbar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        if (isFinite(audio.duration) && audio.duration > 0) {
            audio.currentTime = audio.duration * percent;
        }
        const circle = document.querySelector(".circle");
        if (circle) circle.style.left = percent * 100 + "%";
    });
}

// --- global play/pause ---
if (playP) {
    playP.addEventListener("click", async () => {
        if (!audio.src) {
            // If there's no audio loaded but we have songs, start the first track
            if (songs.length > 0) {
                await playMusic(songs[0], 0);
                return;
            } else {
                return;
            }
        }

        if (audio.paused) {
            try {
                await audio.play();
            } catch (err) {
                console.warn("play() blocked:", err);
            }
        } else {
            audio.pause();
        }
        updatePlayIcons();
    });
}

// prev / next
const previous = document.getElementById("previous");
const next = document.getElementById("next");
if (previous) {
    previous.addEventListener("click", () => {
        if (!songs || songs.length === 0) return;
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : songs.length - 1;
        playMusic(songs[currentIndex], currentIndex);
    });
}
if (next) {
    next.addEventListener("click", () => {
        if (!songs || songs.length === 0) return;
        currentIndex = (currentIndex < songs.length - 1) ? currentIndex + 1 : 0;
        playMusic(songs[currentIndex], currentIndex);
    });
}

// --- CARD CLICK LISTENERS (load playlist but DO NOT stop currently playing track) ---
function attachCardListeners() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async (ev) => {
            ev.stopPropagation();

            const songsFile = card.getAttribute("data-songs");
            if (!songsFile) return;

            try {
                const newSongs = await getSongs("./" + songsFile);
                if (!Array.isArray(newSongs)) throw new Error("Invalid songs file format");

                // preserve currently playing track if it exists in new playlist
                const playingTrack = audio.dataset.track || "";
                const matchIndex = playingTrack ? newSongs.findIndex(s => decodeURI(s) === decodeURI(playingTrack)) : -1;

                songs = newSongs;

                if (matchIndex !== -1) {
                    // current playing track exists in new playlist -> set currentIndex accordingly
                    currentIndex = matchIndex;
                } else {
                    // otherwise default to the first song in the new playlist for list highlighting
                    currentIndex = 0;
                }

                populateSongList();

                // If there's a currently playing track, keep the playbar showing it.
                // If nothing is playing, show the first song of the new playlist (but don't autoplay).
                const titleEl = document.querySelector(".playbar-container .song-info1");
                if (titleEl) {
                    if (audio.src && audio.dataset.track) {
                        // show currently playing (best-effort)
                        titleEl.textContent = (audio.dataset.track || "").replaceAll("%20", " ");
                    } else if (songs.length > 0) {
                        titleEl.textContent = songs[0].replaceAll("%20", " ");
                    } else {
                        titleEl.textContent = "";
                    }
                }

                // IMPORTANT: do NOT pause or clear audio.src here — playback should continue until user pauses.
                updatePlayIcons();

                // open the library/sidebar so user sees the loaded list
                const left = document.querySelector(".left");
                if (left && !left.classList.contains("active")) {
                    left.classList.add("active");
                    // keep menu icon consistent with sidebar state
                    const menuToggle = document.getElementById("menuToggle");
                    if (menuToggle) {
                        menuToggle.classList.toggle("ri-menu-line", false);
                        menuToggle.classList.toggle("ri-close-line", true);
                    }
                }
            } catch (err) {
                console.error("Failed to load songs for card:", err);
            }
        });
    });
}

// --- hamburger toggle: robust state-driven approach ---
const menuToggle = document.getElementById("menuToggle");
let isMenuOpen = false;
if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        isMenuOpen = !isMenuOpen;
        const left = document.querySelector(".left");
        if (left) left.classList.toggle("active", isMenuOpen);

        // apply classes deterministically
        menuToggle.classList.toggle("ri-menu-line", !isMenuOpen);
        menuToggle.classList.toggle("ri-close-line", isMenuOpen);
    });
}

// --- open sidebar on mobile when a card clicked (keeps behavior but doesn't override menu icon) ---
function openSidebarOnMobile() {
    const isMobile = () => window.matchMedia("(max-width: 500px)").matches;
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            if (isMobile()) {
                const left = document.querySelector(".left");
                if (left && !left.classList.contains("active")) {
                    left.classList.add("active");
                    isMenuOpen = true;
                    if (menuToggle) {
                        menuToggle.classList.toggle("ri-menu-line", false);
                        menuToggle.classList.toggle("ri-close-line", true);
                    }
                }
            }
        });
    });
}

// --- main ---
async function main() {
    try {
        // load All Songs into the library by default on first visit (but do NOT open sidebar / autoplay)
        songs = await getSongs("./playlists/all_songs.json");
        if (!Array.isArray(songs)) songs = [];
    } catch (err) {
        console.error("Could not load playlists/all_songs.json:", err);
        // fallback to generic songs.json if all_songs not present
        try {
            songs = await getSongs();
            if (!Array.isArray(songs)) songs = [];
        } catch (err2) {
            console.error("Could not load default songs.json either:", err2);
            songs = [];
        }
    }

    populateSongList();
    attachCardListeners();
    openSidebarOnMobile();

    // DON'T autoplay on initial load — user must press Play (avoids autoplay blocking & surprises)
    updatePlayIcons();
}

// start
main();
