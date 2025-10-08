async function getSongs() {
       
    let a = await fetch("http://127.0.0.1:3000/songs/")
    let response = await a.text();
    console.log(response)
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    let songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if(element.href.endsWith(".mp3")){
            if (element.href.includes("songs%5C")) {
                songs.push(element.href.split("songs%5C")[1])
            } else if (element.href.includes("songs/")) {
                songs.push(element.href.split("songs/")[1])
            } else {
                songs.push(element.href.split(/[/\\]/).pop())
            }
        }
    }
    return songs
}
let audio = new Audio()
const playMusic = (track)=>{
    audio.src = "https://divyansh1502.github.io/Spotify/songs/" + track
    audio.play()
}
async function main() {

    let currentSong;
let songs = await getSongs()
console.log(songs)


//Show all the songs in Playlist

let songUL = document.querySelector(".song-list").getElementsByTagName("ul")[0]
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
//Attach an eventListner to each song
Array.from(document.querySelector(".song-list").getElementsByTagName("li")).forEach((e, i) => {
    e.addEventListener("click", element=>{
    let track = e.querySelector(".song-info").firstElementChild.innerHTML.trim();
    let playIcon = e.querySelector(".play1 i");

    // Reset all icons to play
    document.querySelectorAll(".play1 i").forEach(icon => {
        icon.className = "ri-play-large-fill";
    });

    if (!audio.src.includes(track) || audio.paused) {
        playMusic(track);
        playIcon.className = "ri-pause-large-fill";
    } else {
        audio.pause();
        playIcon.className = "ri-play-large-fill";
    }

    audio.onended = () => {
        playIcon.className = "ri-play-large-fill";
    };
});

});
    
    audio.addEventListener("loadeddata", () =>{
        let duration = audio.duration;
        console.log(audio.duration, audio.currentSrc, audio.currentTime)
    })
} 
main()
