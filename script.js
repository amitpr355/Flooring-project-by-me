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

// 5. Apply the Mask (floor_image.png)
// This tells Three.js where NOT to draw the floor (the walls/tables)
// loader.load('./image-with-transparent-floor.png', (mask) => {
//     floorMaterial.alphaMap = mask;
//     floorMaterial.needsUpdate = true;
// });
// floorMaterial.polygonOffset = true;  
// floorMaterial.polygonOffsetFactor = 1;
// floorMaterial.polygonOffsetUnits = 1;

let currentTexture = null;
let rotationAngle = 0;

// 6. Function to update texture from UI
// window.updateFloor = (imageUrl) => {
//     loader.load(imageUrl, (tex) => {
//         tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
//         tex.repeat.set(64, 64); // Controls tile size
//         tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
//         floorMaterial.map = tex;
//         floorMaterial.needsUpdate = true;
//     });
// };

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

    // Default repeat values
    let repeatX = 20;
    let repeatY = 20;

    // Adjust according to selected tile size
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

    currentTexture.repeat.set(repeatX, repeatY);

    // Rotation
    currentTexture.center.set(0.5, 0.5);
    currentTexture.rotation = THREE.MathUtils.degToRad(rotationAngle);

    currentTexture.needsUpdate = true;
}

// Load initial texture
// updateFloor('./wood.jpg');

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