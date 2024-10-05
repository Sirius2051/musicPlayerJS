const audioPlayer = document.getElementById("audioPlayer");
const playList = document.getElementById('playList');
let currentTrackIndex = 0;

const canvas = document.getElementById("waveformCanvas");
const canvasContext = canvas.getContext("2d");
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
const source = audioContext.createMediaElementSource(audioPlayer);

const progressContainer = document.getElementById('progress-container');
        const progress = document.getElementById('progress');
        const volumeControl = document.getElementById('volume');
source.connect(analyser);
analyser.connect(audioContext.destination);

function updatePlayList() {
    playList.innerHTML = "";
    [...Array(localStorage.length).keys()].forEach((id) => {
        var song = JSON.parse(localStorage.getItem(id));
        playList.innerHTML += `
        <tr>
            <td>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M14 12c0 1.103-.897 2-2 2-1.104 0-2-.897-2-2s.896-2 2-2c1.103 0 2 .897 2 2zm9.778-2.271c.142.736.222 1.494.222 2.271 0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12c4.545 0 9.564 2.835 9.996 7.056.373 3.646-2.594 6.949-3.192 7.574l1.445 1.383c.549-.574 2.784-3.073 3.529-6.284zm-19.258-.52c.814-2.157 2.529-3.869 4.691-4.677l-.129-1.019c-2.613.896-4.68 2.958-5.582 5.569l1.02.127zm4.945-2.64l-.131-1.041c-1.721.71-3.096 2.085-3.807 3.807l1.041.13c.598-1.272 1.625-2.299 2.897-2.896zm6.535 5.431c0-2.209-1.791-4-4-4s-4 1.791-4 4 1.791 4 4 4 4-1.791 4-4zm3.784 4.94l-1.878-1.832-2.64 2.679 1.882 1.834 2.636-2.681z"/></svg>
            </td>
            <td>
                <a href="#" data-url="${song.url}" data-id="${id}" onclick="playAudio(event)">
                    ${song.name.slice(0, -4)}
                </a>
            </td>
        </tr>
        `;
    });
}
function dropHandler(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length) {
        const file = files[0];
        console.log(file)
        const fileURL = URL.createObjectURL(file);
        audioPlayer.src = fileURL;
        audioPlayer.play();
    }
    removeDragData(event);
}
function dragOverHandler(event) {
    event.preventDefault();
}
function removeDragData(event) {
    if (event.dataTransfer.items) {
      event.dataTransfer.items.clear();
    } else {
      event.dataTransfer.clearData();
    }
}

document.querySelector("#addPlayList").addEventListener("click", async () => {
    try {
        const ref = await window.showDirectoryPicker();
        console.log(ref)
        localStorage.clear()
        for await (const file of ref.values()) {
            if (file.kind == "file") {
                const file2 = await file.getFile();
                const fileURL = URL.createObjectURL(file2);
                var data = {name: file.name, url: fileURL}
                localStorage.setItem(localStorage.length, JSON.stringify(data));
            }
        }
        updatePlayList()
    } catch (err) {
        console.log("Error en la carga. " + err);
    }
});

function playAudio(event) {
    event.preventDefault();
    const fileURL = event.target.getAttribute("data-url");
    currentTrackIndex = parseInt(event.target.getAttribute("data-id"));
    audioPlayer.src = fileURL;
    audioPlayer.play();
}

audioPlayer.addEventListener('ended', () => {
    currentTrackIndex++;
    if (currentTrackIndex < localStorage.length) {
        var nextSong = JSON.parse(localStorage.getItem(currentTrackIndex));
        console.log(nextSong)
        audioPlayer.src = nextSong.url;
        audioPlayer.play();
    } else {
        currentTrackIndex = 0;
        var nextSong = JSON.parse(localStorage.getItem(currentTrackIndex));
        console.log(nextSong)
        audioPlayer.src = nextSong.url;
        audioPlayer.play();
    }
});

audioPlayer.addEventListener('timeupdate', updateProgress);

function updateProgress() {
    const { currentTime, duration } = audioPlayer;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}

progressContainer.addEventListener('click', setProgress);

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
}


audioPlayer.addEventListener('play', () => {
    audioContext.resume();
    requestAnimationFrame(drawWaveform);
});

function drawWaveform() {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

    canvasContext.fillStyle = '#2C3E5077';
    canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = '#e74c3c';

    canvasContext.beginPath();

    const sliceWidth = WIDTH / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * HEIGHT / 2;

        if (i === 0) {
            canvasContext.moveTo(x, y);
        } else {
            canvasContext.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasContext.lineTo(WIDTH, HEIGHT / 2);
    canvasContext.stroke();

    if (!audioPlayer.paused) {
        requestAnimationFrame(drawWaveform);
    }
}
volumeControl.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value;
});

var playButton = document.getElementById('play')
var pauseButton = document.getElementById('pause')
var stopButton = document.getElementById('stop')
var previaButton = document.getElementById('previa')
var siguienteButton = document.getElementById('siguiente')

playButton.addEventListener('click', () => {
    audioPlayer.play()
});
pauseButton.addEventListener('click', () => {
    audioPlayer.pause()
});
stopButton.addEventListener('click', () => {
    audioPlayer.currentTime = 0;
});

previaButton.addEventListener('click', () => {
    currentTrackIndex -= 2;
    audioPlayer.currentTime = audioPlayer.duration;
});

siguienteButton.addEventListener('click', () => {
    audioPlayer.currentTime = audioPlayer.duration;
});