'use strict';

const MAX_SIZE = 200; // Max size of "history"
const FFT_SIZE = 256; // Size of FFT

import * as THREE from '/three/build/three.module.js';
import { OrbitControls } from '/three/examples/jsm/controls/OrbitControls.js'

alert("    CONTROLS: \n Move Around: Right Mouse \n Look Around: Left Mouse \n Zoom: Scroll Wheel ");

/* ---------------------- Setup -------------------- */
// ThreeJS
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({canvas});

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-200, 500, 900);
camera.lookAt(0, 0, 0);
const scene = new THREE.Scene();

// FPS Canvas
const confDOM = document.getElementById('config');

// Setup JS Audio API
let dataArray;
let bufferLength;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();

/* ---------------------- Setup -------------------- */


/* ---------------------- Audio Stream -------------------- */
// Cube for easier positional orientation
(function() {
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x32a86b });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
})();

// Use an audio stream
(function createAudioStream(domEl) {
    const source = audioCtx.createMediaElementSource(domEl);
    source.connect(analyser);
    source.connect(audioCtx.destination);
    analyser.fftSize = FFT_SIZE;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
})(document.getElementsByTagName('audio')[0]);

// Use user mic
(async function getMedia() {
    let stream = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia({audio:true, video: false});
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        source.connect(audioCtx.destination);
        analyser.fftSize = 256;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    } catch (err) {
        console.log(err);
    }
});

/* ---------------------- Audio Stream -------------------- */




/* ---------------------- Visualizer -------------------- */

// Data is aggregated here
const timeStep = [];

// Init lines - divided by two cuz two channels duh
const lines = new Array(analyser.fftSize/2);
for(let i = 0; i < lines.length; i ++) {
    const material = new THREE.LineBasicMaterial({ color: 0x32a86b });
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array( MAX_SIZE * 3 ); // 3 vertices per point
    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

    geometry.setDrawRange(0, MAX_SIZE);

    lines[i] = new THREE.Line(geometry, material);
    scene.add(lines[i])
}

const updateLine = () => {
    analyser.getByteTimeDomainData(dataArray);

    // push all the frequencies in timeStep
    timeStep.push(JSON.parse(JSON.stringify(dataArray)));
    timeStep.length > MAX_SIZE ? timeStep.shift() : null;

    for (let i = 0; i < dataArray.length; i++) {
        for (let m = 0; m < timeStep.length; m++) {
            const positions = lines[i].geometry.attributes.position.array;
            positions[m * 3] = 500 - m * 5;
            positions[m * 3 + 1] = timeStep[m][i];
            positions[m * 3 + 2] = 200 - i * 5;
        }
        lines[i].geometry.attributes.position.needsUpdate = true;
    }
}

const updateCameraPos = () => {

}
/* ---------------------- Visualizer -------------------- */




/* ---------------------- Main Loop -------------------- */

let lastUpdate = new Date();

let frame = 0;
const update = () => {
    frame ++;
    const now = Date.now();
    const dt = now - lastUpdate;

    frame = frame % 10;
    if (frame == 0) {
        const fps = parseInt(1000.0 / dt);
        confDOM.innerHTML = `FPS: ${fps} <br>
         MAX_SIZE: ${MAX_SIZE} <br>
         FFT_SIZE: ${FFT_SIZE} <br>`;
    }

    updateLine();

    window.requestAnimationFrame(update);
    renderer.render(scene, camera);

    lastUpdate = now;
}
update();

/* ---------------------- Main Loop -------------------- */
