import { circlesVisualization, waveformVisualization, barsVisualization } from './visualizations.js';

let audioContext;
let analyzerNode;
let dataArray;
let timeDomainArray;
let source;
let audioBuffer;
let isPlaying = false;
let rafId = null;

const fileInput = document.getElementById('file-input');
const dropArea = document.getElementById('drop-area');
const errorMessage = document.getElementById('error-message');
const playButton = document.getElementById('play-button');
const pauseButton = document.getElementById('pause-button');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const visualizationSelect = document.getElementById('visualization-type');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let currentVisualization = circlesVisualization;
let audioDuration = 0;

// Adjust canvas size to match container size
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

// Initialize AudioContext and analyzer
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyzerNode = audioContext.createAnalyser();
    analyzerNode.fftSize = 1024; 
    dataArray = new Uint8Array(analyzerNode.frequencyBinCount);
    timeDomainArray = new Uint8Array(analyzerNode.fftSize);
  }
}

// Render loop
function animate() {
  rafId = requestAnimationFrame(animate);

  // Get frequency and time-domain data
  analyzerNode.getByteFrequencyData(dataArray);
  analyzerNode.getByteTimeDomainData(timeDomainArray);

  // Switch based on current visualization
  const width = canvas.width;
  const height = canvas.height;

  switch (visualizationSelect.value) {
    case 'circles':
      currentVisualization = circlesVisualization;
      currentVisualization(ctx, dataArray, width, height);
      break;
    case 'waveform':
      currentVisualization = waveformVisualization;
      currentVisualization(ctx, timeDomainArray, width, height);
      break;
    case 'bars':
      currentVisualization = barsVisualization;
      currentVisualization(ctx, dataArray, width, height);
      break;
    default:
      currentVisualization = circlesVisualization;
      currentVisualization(ctx, dataArray, width, height);
  }

  updateSeekBar();
}

// Update the seek slider and time display
function updateSeekBar() {
  if (!audioContext || !source) return;
  const currentTime = audioContext.currentTime;
  if (currentTime <= audioDuration) {
    seekSlider.value = currentTime;
    currentTimeDisplay.textContent = formatTime(currentTime);
  } else {
    // Audio ended
    stopAnimation();
  }
}

// Helper to format time in mm:ss
function formatTime(time) {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Stop the render loop
function stopAnimation() {
  cancelAnimationFrame(rafId);
  rafId = null;
  isPlaying = false;
  playButton.disabled = false;
  pauseButton.disabled = true;
}

// Handle file upload and decode
async function handleFile(file) {
  errorMessage.textContent = ''; // clear previous error
  if (!file || !file.type.includes('audio')) {
    errorMessage.textContent = 'Please upload a valid audio file (mp3).';
    return;
  }

  initAudioContext();

  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = async (e) => {
    try {
      audioBuffer = await audioContext.decodeAudioData(e.target.result);
      setupAudioSource();
      displayAudioLength();
    } catch (err) {
      console.error(err);
      errorMessage.textContent = 'Error decoding audio file.';
    }
  };
}

function setupAudioSource() {
  if (source) {
    source.disconnect();
  }

  source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyzerNode);
  analyzerNode.connect(audioContext.destination);

  // After connecting, we can update UI states
  playButton.disabled = false;
  pauseButton.disabled = false;
}

function displayAudioLength() {
  audioDuration = audioBuffer.duration;
  durationDisplay.textContent = formatTime(audioDuration);
  seekSlider.max = audioDuration;
  seekSlider.value = 0;
  currentTimeDisplay.textContent = '0:00';
}

// Play / Pause
function playAudio() {
  if (!source) return;

  // If we’re creating a new buffer each time, we need to re-setup the source
  setupAudioSource();
  source.start(0, seekSlider.value);
  audioContext.resume().then(() => {
    isPlaying = true;
    playButton.disabled = true;
    pauseButton.disabled = false;
    animate();
  });
}

function pauseAudio() {
  if (!source) return;

  source.stop(0);
  stopAnimation();
  seekSlider.value = audioContext.currentTime; 
}

// Seeking
seekSlider.addEventListener('input', () => {
  if (isPlaying) {
    // If playing, re-start from new position
    source.stop();
    stopAnimation();
    playAudio();
  }
});

// Volume
volumeSlider.addEventListener('input', (e) => {
  const volume = e.target.value;
  analyzerNode.context.destination.gain.value = volume; 
  // Alternatively, create a GainNode in between analyzerNode & destination.
});

// Drag-and-Drop
dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.classList.remove('dragover');

  const file = e.dataTransfer.files[0];
  handleFile(file);
});

// File input listener
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  handleFile(file);
});

// Play / Pause Buttons
playButton.addEventListener('click', playAudio);
pauseButton.addEventListener('click', pauseAudio);

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();  // initial sizing
