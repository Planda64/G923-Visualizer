// =============================================================================
// CONFIGURATION & MAPPINGS
// =============================================================================

const CONFIG = {
    maxRotation: 900,

    // Image URLs
    imgWheel: "images/wheel.png",
    imgPedalBase: "images/pedals.png",
    imgGas: "images/gas.png",
    imgBrake: "images/brake.png",
    imgClutch: "images/clutch.png",
    imgShifterBase: "images/shifter-base.png",
    imgShifter: "images/shifter.png",

    // AXIS MAPPINGS (Change wheel/pedals axis indices here)
    axisWheel: 0,
    axisGas: 1,
    axisBrake: 2,
    axisClutch: 5,

    // Axis Inversions
    invertWheel: false,
    invertGas: false,
    invertBrake: false,
    invertClutch: false,

    // GEAR BUTTON MAPPINGS (Change shifter button indices here)
    btnGear1: 12,
    btnGear2: 13,
    btnGear3: 14,
    btnGear4: 15,
    btnGear5: 16,
    btnGear6: 17,
    btnGearR: 11
};

// =============================================================================
// DOM CREATION & LAYOUT
// =============================================================================

const mainContainer = document.createElement("div");
mainContainer.style.width = "600px";
mainContainer.style.position = "relative";
document.body.appendChild(mainContainer);

// 1. Wheel
const wheelPositioner = document.createElement("div");
wheelPositioner.style.position = "relative";

const wheelContainer = document.createElement("div");
wheelContainer.style.position = "relative";

const imgWheel = document.createElement("img");
imgWheel.src = CONFIG.imgWheel;
imgWheel.alt = "";
imgWheel.width = 500;
imgWheel.height = 500;

wheelContainer.appendChild(imgWheel);
wheelPositioner.appendChild(wheelContainer);
mainContainer.appendChild(wheelPositioner);

// 2. Shifter
const shifterPositioner = document.createElement("div");
shifterPositioner.style.position = "relative";
shifterPositioner.style.top = "-150px";
shifterPositioner.style.left = "450px";
shifterPositioner.style.marginLeft = "50px";

const shifterContainer = document.createElement("div");
shifterContainer.style.position = "relative";

// holder moves as one unit so the R label rides along with the shifter head
const shifterHead = document.createElement("div");
shifterHead.style.width = "150px";
shifterHead.style.zIndex = "999";
shifterHead.style.position = "absolute";
shifterHead.style.top = "70px";
shifterHead.style.left = "50px";

const imgShifter = document.createElement("img");
imgShifter.src = CONFIG.imgShifter;
imgShifter.alt = "";
imgShifter.style.width = "150px";
imgShifter.style.display = "block";

// the R drawn on the knob, only visible in reverse
const reverseLabel = document.createElement("div");
reverseLabel.textContent = "R";
reverseLabel.style.position = "absolute";
reverseLabel.style.top = "29%";
reverseLabel.style.left = "53%";
reverseLabel.style.transform = "translate(-50%, -50%)";
reverseLabel.style.font = "bold 62px Arial, sans-serif";
reverseLabel.style.color = "#fff";
reverseLabel.style.webkitTextStroke = "5px #000";
reverseLabel.style.paintOrder = "stroke fill";
reverseLabel.style.pointerEvents = "none";
reverseLabel.style.display = "none";

shifterHead.appendChild(imgShifter);
shifterHead.appendChild(reverseLabel);

const imgShifterBase = document.createElement("img");
imgShifterBase.src = CONFIG.imgShifterBase;
imgShifterBase.alt = "";
imgShifterBase.width = 250;

shifterContainer.appendChild(shifterHead);
shifterContainer.appendChild(imgShifterBase);
shifterPositioner.appendChild(shifterContainer);
mainContainer.appendChild(shifterPositioner);

// 3. Pedals
const pedalsPositioner = document.createElement("div");
pedalsPositioner.style.position = "relative";
pedalsPositioner.style.top = "-200px";
pedalsPositioner.style.marginLeft = "50px";

const pedalsContainer = document.createElement("div");
pedalsContainer.style.position = "relative";

const createPedalImage = (src, top, left) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    img.style.width = "70px";
    img.style.position = "absolute";
    img.style.top = top + "px";
    img.style.left = left + "px";
    return img;
};

const imgGas = createPedalImage(CONFIG.imgGas, -20, 290);
const imgBrake = createPedalImage(CONFIG.imgBrake, -10, 160);
const imgClutch = createPedalImage(CONFIG.imgClutch, -10, 40);

const imgPedalBase = document.createElement("img");
imgPedalBase.src = CONFIG.imgPedalBase;
imgPedalBase.alt = "";
imgPedalBase.style.width = "400px";

pedalsContainer.appendChild(imgGas);
pedalsContainer.appendChild(imgBrake);
pedalsContainer.appendChild(imgClutch);
pedalsContainer.appendChild(imgPedalBase);
pedalsPositioner.appendChild(pedalsContainer);
mainContainer.appendChild(pedalsPositioner);

// =============================================================================
// GAMEPAD INPUT LOOP
// =============================================================================

// tell the browser these will animate so it moves them to the gpu
[imgWheel, imgGas, imgBrake, imgClutch, shifterHead].forEach(function (el) {
    el.style.willChange = "transform";
});

// button index -> gear number (checked in order so higher gears win like before)
const GEARS = [
    { btn: CONFIG.btnGear1, gear: 1 },
    { btn: CONFIG.btnGear2, gear: 2 },
    { btn: CONFIG.btnGear3, gear: 3 },
    { btn: CONFIG.btnGear4, gear: 4 },
    { btn: CONFIG.btnGear5, gear: 5 },
    { btn: CONFIG.btnGear6, gear: 6 },
    { btn: CONFIG.btnGearR, gear: 6, reverse: true } // same spot as 6 just with the R label
];

const GRID_SIZE = 150;
const N = GRID_SIZE / 2;
const R = GRID_SIZE / 2.2;

// gear number -> [x, y] shifter offset
const GEAR_POS = {
    1: [-N, -R],
    2: [-N, R],
    3: [0, -R],
    4: [0, R],
    5: [N, -R],
    6: [N, R]
};

// last written values so we only touch the dom when something changed
const last = {
    wheel: null,
    gas: null,
    brake: null,
    clutch: null,
    gear: null
};

let gamepadIndex = -1;

window.addEventListener("gamepadconnected", function (e) {
    if (gamepadIndex === -1) gamepadIndex = e.gamepad.index;
});

window.addEventListener("gamepaddisconnected", function (e) {
    if (e.gamepad.index === gamepadIndex) gamepadIndex = -1;
});

function getAxisValue(gamepad, index) {
    const v = gamepad.axes[index];
    return v === undefined ? 0 : v;
}

function isButtonPressed(gamepad, index) {
    const btn = gamepad.buttons[index];
    return btn !== undefined && (typeof btn === "object" ? btn.pressed : btn === 1.0);
}

function updatePedalPosition(imgElement, key, axisVal, downAmount, isInverted) {
    const movement = downAmount * axisVal * (isInverted ? 1 : -1);
    if (last[key] === movement) return;
    last[key] = movement;
    imgElement.style.transform = "translate3d(0," + movement + "px,0)";
}

function updateShifterPosition(gamepad) {
    // the last matching button wins so reverse beats 6 like it should
    let activeGear = -1;
    let reverse = false;
    for (let i = 0; i < GEARS.length; i++) {
        if (isButtonPressed(gamepad, GEARS[i].btn)) {
            activeGear = GEARS[i].gear;
            reverse = !!GEARS[i].reverse;
        }
    }

    // key doubles as change detection so 6 and R still update when swapping
    const key = reverse ? "R" : activeGear;
    if (last.gear === key) return;
    last.gear = key;

    const pos = GEAR_POS[activeGear];
    const home = !pos;
    reverseLabel.style.display = reverse ? "block" : "none";
    shifterHead.style.transition = "all " + (home ? "500ms" : "100ms");
    shifterHead.style.transform = home
        ? "translate3d(0,0,0)"
        : "translate3d(" + pos[0] + "px," + pos[1] + "px,0)";
}

// grab the first connected pad once then reuse the index
function getGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (gamepadIndex !== -1 && pads[gamepadIndex]) return pads[gamepadIndex];

    // fallback in case the connected event was missed (page loaded with pad already on)
    for (let i = 0; i < pads.length; i++) {
        if (pads[i]) {
            gamepadIndex = i;
            return pads[i];
        }
    }
    gamepadIndex = -1;
    return null;
}

function pollGamepad() {
    const gp = getGamepad();

    if (gp) {
        // 1. steering wheel
        const rotationDeg = getAxisValue(gp, CONFIG.axisWheel) * (CONFIG.maxRotation / 2) * (CONFIG.invertWheel ? -1 : 1);
        if (last.wheel !== rotationDeg) {
            last.wheel = rotationDeg;
            imgWheel.style.transform = "rotate(" + rotationDeg + "deg)";
        }

        // 2. pedals
        updatePedalPosition(imgGas, "gas", getAxisValue(gp, CONFIG.axisGas), 50, CONFIG.invertGas);
        updatePedalPosition(imgBrake, "brake", getAxisValue(gp, CONFIG.axisBrake), 50, CONFIG.invertBrake);
        updatePedalPosition(imgClutch, "clutch", getAxisValue(gp, CONFIG.axisClutch), 50, CONFIG.invertClutch);

        // 3. shifter
        updateShifterPosition(gp);
    }

    requestAnimationFrame(pollGamepad);
}

requestAnimationFrame(pollGamepad);