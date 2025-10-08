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

async function getSongs() {
    let response = await fetch("./songs.json");
    let songs = await response.json();
    return songs;
}


let audio = new Audio();

const playMusic = (track) => {
    audio.src = "./songs/" + track; // Relative path
    audio.play();
    document.querySelector(".playbar-container .song-info1").innerHTML = track.replaceAll("%20", " ");
    document.querySelector(".song-time").innerHTML = "00:00 / 00:00";
};


async function main() {
    let currentSong;
    let songs = await getSongs();
    console.log(songs);

    // Show all the songs in Playlist
    let songUL = document.querySelector(".song-list").getElementsByTagName("ul")[0];
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><div class="info">
                  <div class="music">
                    <i class="ri-music-fill"></i>
                  </div>
                  <div class="song-info">
                  <div>${song.replaceAll("%20", " ")}</div>
                  <div>Karan Aujla</div>
                  </div>
                </div>
                <div class="play1">
                  <i class="ri-play-large-fill"></i>
                  </div></li>`;
    }
    if (songs.length > 0) playMusic(songs[0]);


    // Attach an event listener to each song
    Array.from(document.querySelector(".song-list").getElementsByTagName("li")).forEach((e, i) => {
        e.addEventListener("click", element => {
            let track = e.querySelector(".song-info").firstElementChild.innerHTML.trim();
            let playIcon = e.querySelector(".play1 i");

            // Reset all icons to play
            document.querySelectorAll(".play1 i").forEach(icon => {
                icon.className = "ri-play-large-fill";
            });

            if (!audio.src.includes(track) || audio.paused) {
                playMusic(track);
                playIcon.className = "ri-pause-large-fill";

                playP.innerHTML = `<i class="ri-pause-large-line"></i>`;

            } else {
                audio.pause();
                playIcon.className = "ri-play-large-fill";
            }

            audio.onended = () => {
                playIcon.className = "ri-play-large-fill";
            };
        });
    });

    audio.addEventListener("loadeddata", () => {
        let duration = audio.duration;
        console.log(audio.duration, audio.currentSrc, audio.currentTime);
    });

    // Attach an event listener to play, next and previous
    const playP = document.getElementById("playP");

    playP.addEventListener("click", () => {
        if (audio.paused) {
            audio.play();
            playP.innerHTML = `<i class="ri-pause-large-line"></i>`;
        } 
        else {
            audio.pause();
            playP.innerHTML = `<i class="ri-play-large-fill"></i>`;
        }
    });

    // Listen for time update event (FIXED)
    audio.addEventListener("timeupdate", () => {
        document.querySelector(".song-time").innerHTML = `${secondsToMinutesSeconds(audio.currentTime)} / ${secondsToMinutesSeconds(audio.duration)}`;
        document.querySelector(".circle").style.left = (audio.currentTime/ audio.duration) * 100 + "%";
    });

    // Add a eventlistner to the seekbar
    document.querySelector(".seekbar").addEventListener("click", e=>{
        let percent = (e.offsetX/e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        audio.currentTime = ((audio.duration) * percent)/100
    })
    
}

main();
