import * as THREE from 'three';

const container = document.getElementById('viewer-container');

// 1. Scene Setup - Alpha: true is what makes the 3D background transparent
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

// 2. Lights (Required for MeshStandardMaterial)
const ambient = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0);
sun.position.set(5, 10, 7);
scene.add(sun);

// 3. Loaders
const loader = new THREE.TextureLoader();

// 4. Create the Floor Plane
const floorGeometry = new THREE.PlaneGeometry(1060, 1660); // Large enough to cover the floor area
const floorMaterial = new THREE.MeshStandardMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    alphaTest: 0.5
});

const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

// --- ALIGNING PERSPECTIVE ---
// You must adjust these values so the 3D plane matches the photo's floor angle
floorMesh.rotation.x = -Math.PI / 2.15; // Tilted to match perspective
floorMesh.position.y = -25;           // Lowered to match the floor level
floorMesh.position.z = -5;             // Pushed into the room
scene.add(floorMesh);

camera.position.set(0, 0, 10);

let currentTexture = null;
let rotationAngle = 0;

window.updateFloor = (imageUrl) => {
    loader.load(imageUrl, (tex) => {

        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

        currentTexture = tex;

        applyTileSettings();

        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

        floorMaterial.map = tex;
        floorMaterial.needsUpdate = true;
    });
};

document.getElementById("size-change").addEventListener("change", () => {
    applyTileSettings();
});

document.getElementById("rotate-btn").addEventListener("click", () => {
    rotationAngle -= 15;
    applyTileSettings();
});


function applyTileSettings() {

    if (!currentTexture) return;

    const sizeValue = document.getElementById("size-change").value;
    const pattern = document.getElementById("pattern-change").value;

    let repeatX = 20;
    let repeatY = 20;

    switch (sizeValue) {

        case "30x30":
            repeatX = 40;
            repeatY = 40;
            break;

        case "30x60":
            repeatX = 20;
            repeatY = 40;
            break;

        case "60x30":
            repeatX = 40;
            repeatY = 20;
            break;

        case "60x60":
            repeatX = 20;
            repeatY = 20;
            break;
    }

    // NORMAL PATTERN
    if (pattern === "normal") {

        currentTexture.wrapS = currentTexture.wrapT = THREE.RepeatWrapping;

        currentTexture.repeat.set(repeatX, repeatY);

        currentTexture.center.set(0.5, 0.5);
        currentTexture.rotation = THREE.MathUtils.degToRad(rotationAngle);

        floorMaterial.map = currentTexture;
    }

    else if (pattern === "herringbone") {

        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 1200;

        const ctx = canvas.getContext("2d");

        const img = currentTexture.image;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const tileLength = 160;
        const tileWidth = 80;

        for (let row = -10; row < 20; row++) {

            for (let col = -10; col < 20; col++) {

                const baseX = col * tileLength;
                const baseY = row * tileLength;

                const isEven = (row + col) % 2 === 0;

                ctx.save();

                ctx.translate(baseX, baseY);

                ctx.rotate(
                    isEven
                        ? Math.PI / 4
                        : -Math.PI / 4
                );

                ctx.drawImage(
                    img,
                    -tileWidth / 2,
                    -tileLength / 2,
                    tileWidth,
                    tileLength
                );

                ctx.restore();
            }
        }
        const herringboneTexture = new THREE.CanvasTexture(canvas);

        herringboneTexture.wrapS = THREE.RepeatWrapping;
        herringboneTexture.wrapT = THREE.RepeatWrapping;

        herringboneTexture.repeat.set(
            repeatX / 5,
            repeatY / 5
        );

        herringboneTexture.center.set(0.5, 0.5);

        herringboneTexture.rotation =
            THREE.MathUtils.degToRad(rotationAngle);

        floorMaterial.map = herringboneTexture;
    }

    floorMaterial.needsUpdate = true;
}

// Load initial texture
updateFloor('./wood.jpg');

// 7. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// 8. Resize Listener
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

document.getElementById("pattern-change").addEventListener("change", () => {
    applyTileSettings();
});