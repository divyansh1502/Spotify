// main.js

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(file = "./songs.json") {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`Failed to fetch ${file}: ${res.status}`);
    return await res.json();
}

// Globals for easy access across functions
let songs = [];
let currentIndex = 0;
const audio = new Audio();

// main play button reference (ensure your HTML has element with id "playP")
const playP = document.getElementById("playP");

// Safely update UI play/pause icons
function updatePlayIcons() {
    // Reset all per-row icons
    document.querySelectorAll(".play1 i").forEach(icon => {
        icon.className = "ri-play-large-fill";
    });

    const listItems = document.querySelectorAll(".song-list li");
    if (listItems.length > 0 && listItems[currentIndex]) {
        const icon = listItems[currentIndex].querySelector(".play1 i");
        if (icon) icon.className = audio.paused ? "ri-play-large-fill" : "ri-pause-large-fill";
    }

    // Update global play button
    if (audio.src && !audio.paused) {
        playP.innerHTML = `<i class="ri-pause-large-line"></i>`;
    } else {
        playP.innerHTML = `<i class="ri-play-large-fill"></i>`;
    }
}

// Build song list HTML and attach click listeners
function populateSongList() {
    const songUL = document.querySelector(".song-list ul");
    if (!songUL) return;
    let html = "";
    songs.forEach((song, i) => {
        html += `<li data-index="${i}">
            <div class="info">
              <div class="music"><i class="ri-music-fill"></i></div>
              <div class="song-info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div>Karan Aujla</div>
              </div>
            </div>
            <div class="play1"><i class="ri-play-large-fill"></i></div>
        </li>`;
    });
    songUL.innerHTML = html;

    // attach listeners
    Array.from(songUL.getElementsByTagName("li")).forEach((li, i) => {
        li.addEventListener("click", () => {
            const idx = Number(li.dataset.index);
            currentIndex = idx;
            playMusic(songs[currentIndex], currentIndex);
        });
    });
}

// Improved playMusic: uses dataset.track for reliable comparisons, encodes file path
async function playMusic(track, index = null) {
    if (!track) return;

    const songPath = "./songs/" + encodeURI(track);
    audio.dataset.track = track; // reliable string compare later
    audio.src = songPath;

    // sync index
    if (index !== null) currentIndex = index;
    else {
        const idx = songs.indexOf(track);
        if (idx !== -1) currentIndex = idx;
    }

    // update displayed title immediately
    const titleEl = document.querySelector(".playbar-container .song-info1");
    if (titleEl) titleEl.textContent = track.replaceAll("%20", " ");

    // reset time UI while loading
    const timeEl = document.querySelector(".song-time");
    if (timeEl) timeEl.textContent = `00:00 / 00:00`;

    // attempt to play (catch autoplay blocked)
    try {
        await audio.play();
    } catch (err) {
        // Autoplay likely blocked — show play icon so user can manually play
        console.warn("play() blocked or failed:", err);
    }

    updatePlayIcons();
}

// Guarded timeupdate handler
audio.addEventListener("timeupdate", () => {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    const cur = isFinite(audio.currentTime) ? audio.currentTime : 0;

    const timeEl = document.querySelector(".song-time");
    if (timeEl) timeEl.textContent = `${secondsToMinutesSeconds(cur)} / ${secondsToMinutesSeconds(dur)}`;

    const circle = document.querySelector(".circle");
    if (circle) {
        if (dur > 0) circle.style.left = (cur / dur) * 100 + "%";
        else circle.style.left = "0%";
    }
});

// When loadedmetadata / loadeddata, update duration display (if needed)
audio.addEventListener("loadedmetadata", () => {
    const dur = isFinite(audio.duration) ? audio.duration : 0;
    const timeEl = document.querySelector(".song-time");
    if (timeEl) timeEl.textContent = `${secondsToMinutesSeconds(audio.currentTime)} / ${secondsToMinutesSeconds(dur)}`;
});

// Play next on end (wraps)
audio.addEventListener("ended", () => {
    if (!songs || songs.length === 0) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playMusic(songs[currentIndex], currentIndex);
});

// Seekbar click (uses bounding rect for width)
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

// Global play/pause button
if (playP) {
    playP.addEventListener("click", async () => {
        // If no src loaded, play first song (if available)
        if (!audio.src) {
            if (songs.length > 0) {
                await playMusic(songs[0], 0);
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

// Prev / Next buttons (wrap)
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

// Handle card clicks that load a new songs.json (cards should have data-songs attribute)
function attachCardListeners() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const songsFile = card.getAttribute("data-songs");
            if (!songsFile) return;
            try {
                const newSongs = await getSongs("./" + songsFile);
                if (!Array.isArray(newSongs)) throw new Error("Invalid songs file format");
                songs = newSongs;
                currentIndex = 0;
                populateSongList();
                if (songs.length > 0) playMusic(songs[0], 0);
            } catch (err) {
                console.error("Failed to load songs for card:", err);
            }
        });
    });
}

// Hamburger toggle (unchanged)
const hamburger = document.querySelector(".hamburger");
if (hamburger) {
    hamburger.addEventListener("click", () => {
        const left = document.querySelector(".left");
        if (left) left.classList.toggle("active");
    });
}

// Initial setup main()
async function main() {
    try {
        songs = await getSongs(); // default ./songs.json
        if (!Array.isArray(songs)) songs = [];
    } catch (err) {
        console.error("Could not load songs.json:", err);
        songs = [];
    }

    populateSongList();
    attachCardListeners();

    // If we have songs, try to play first one only after a user gesture OR attempt and handle autoplay-respect
    if (songs.length > 0) {
        // Try to play (may be blocked by autoplay policy). This is fine — user can press play.
        try {
            await playMusic(songs[0], 0);
        } catch (err) {
            console.warn("Initial play attempt blocked:", err);
        }
    }

    updatePlayIcons();
}
// Open left sidebar on mobile when a card is clicked (minimal patch)
function openSidebarOnMobile() {
    // same breakpoint as your CSS
    const isMobile = () => window.matchMedia("(max-width: 500px)").matches;

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            if (isMobile()) {
                const left = document.querySelector(".left");
                if (left && !left.classList.contains("active")) {
                    left.classList.add("active");
                }
            }
        });
    });
}

// call it after DOM/cards are available
openSidebarOnMobile();


// Start
main();
