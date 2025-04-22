import { reactive, shallowRef, onMounted } from 'vue'
import * as audio from './audio'
import type { ExplosionData } from './3d/Explosions.vue'
import { Box3, Clock, Euler, Matrix4, Object3D, PerspectiveCamera, Ray, TubeGeometry, Vector2, Vector3, type Vector3Tuple } from 'three'
import { GrannyKnot } from 'three/examples/jsm/curves/CurveExtras.js'
import { timeManager } from './TimeManager';

class WiderGrannyKnot extends GrannyKnot {
    override getPoint(t: number) {
        const original = super.getPoint(t);
        return new Vector3(
            original.x * 1.6,
            original.y * 1.3,
            original.z * 1.15
        );
    }
}

// Define game modes
export enum GameMode {
    Battle = 'Battle',
    Explore = 'Explore'
}

export enum SpeedMode {
    Slow = 'Slow',
    Normal = 'Normal',
    Fast = 'Fast'
}

// Define observation modes
export enum ObservationMode {
    None = 'None',        // Normal movement
    Fixed = 'Fixed',      // Fixed position observation
    Orbiting = 'Orbiting' // Orbiting around a point of interest
}

const TRACK_POSITIONS = {
    START: 0,
    PETERSEN_GRAPH: [0.1, 0.25, 0.55, 0.955],
    Chainweb3D: 0.4,
    WARP_BEGIN: 0.3,
    WARP_END: 0.4,
    WARP_RESET: 0.5,
    RINGS: 0.65,
    SPACE_STATION: 0.79,
    SPACE_PROBE: 0.86,
    LOOP: 1.0
};

const INFO_LABELS = [
    { t: 0.095, text: "Petersen Graph", color: "#4286f4" },         // Softer blue to match the space environment
    { t: 0.245, text: "Graph Theory", color: "#c67eff" },           // Softer purple that harmonizes with stars
    { t: 0.545, text: "Scalable Structure", color: "#4286f4" },      // Matching blue
    { t: 0.95, text: "Remarkable Configuration", color: "#c67eff" },     // Matching purple
    { t: 0.395, text: "Chainweb", color: "#e6c86e" },               // Warmer, less saturated gold
    { t: 0.45, text: "Blockchain", color: "#e6c86e" },              // Matching gold
    { t: 0.49, text: "Kadena", color: "#e6c86e" },                  // Matching gold
    { t: 0.64, text: "3D Visual", color: "#7CFC00" },               // Match track color in exploration mode
    { t: 0.7, text: "Vootaa Lab", color: "#e38846" },              // Warmer orange to match track in battle mode
    { t: 0.78, text: "Space Station", color: "#9f7bea" },           // Softer purple variant
    { t: 0.85, text: "Space Probe", color: "#9f7bea" },             // Same purple for consistency
    { t: 0.98, text: "Welcome to", color: "#20B2AA" },              // Keep this teal to match observation mode track
    { t: 0.99, text: "Explore Journey", color: "#20B2AA" }          // Matching teal
];

// Define points of interest for observation
export const POINTS_OF_INTEREST = {
    PETERSEN_GRAPH: {
        name: 'Petersen Graph',
        trackPosition: TRACK_POSITIONS.PETERSEN_GRAPH[0],
        orbitDistance: 50,
        orbitSpeed: 0.002
    },
    CHAINWEB_3D: {
        name: 'Chainweb 3D',
        trackPosition: TRACK_POSITIONS.Chainweb3D,
        orbitDistance: 120,
        orbitSpeed: 0.0015
    },
    SPACE_STATION: {
        name: 'Space Station',
        trackPosition: TRACK_POSITIONS.SPACE_STATION,
        orbitDistance: 80,
        orbitSpeed: 0.001
    },
    SPACE_PROBE: {
        name: 'Space Probe',
        trackPosition: TRACK_POSITIONS.SPACE_PROBE,
        orbitDistance: 100,
        orbitSpeed: 0.001
    },
};

export const SPEED_SETTINGS = {
    [SpeedMode.Slow]: {
        looptime: 80 * 1000,
        label: 'SLOW',
        factor: 0.5
    },
    [SpeedMode.Normal]: {
        looptime: 60 * 1000,
        label: 'NORMAL',
        factor: 1.0
    },
    [SpeedMode.Fast]: {
        looptime: 40 * 1000,
        label: 'FAST',
        factor: 1.5
    }
};

let guid = 0
const spline = new WiderGrannyKnot()
const track = new TubeGeometry(spline, 200, 0.15, 10, true)

export const gameStore = reactive({
    spline,
    battleScore: 0,
    stardust: 0,
    health: 100,
    loopCount: 0,
    totalLoops: 7, // total game loops
    lasers: [] as number[],
    explosions: [] as ExplosionData[],
    initialRockCount: 100,
    initialEnemyCount: 10,
    rocks: randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5),
    enemies: randomData(10, track, 20, 15, 1),
    rings: generateRings(40, track),
    chainweb3D: generateChainweb3D(30, track),
    PetersenGraphGroup: generatePetersenGraph(track),
    infoLabels: generateInfoLabels(track),
    spaceStation: generateSpaceStationData(track),
    spaceProbe: generateSpaceProbeData(track),
    camera: new PerspectiveCamera(),
    sound: false,
    showInfoText: true, // state to control text visibility
    gameMode: GameMode.Battle, // Default to Battle mode
    speedMode: SpeedMode.Fast, // Default to Fast mode
    modal: {
        show: false,
        type: '', // 'gameOver' or 'switchConfirm'
    },
    timeManager,
    observationMode: ObservationMode.None,
    currentPointOfInterest: null as keyof typeof POINTS_OF_INTEREST | null,
    observedPoints: [] as string[], // previously observed points
    orbitAngle: 0,
    orbitHeight: 0,
    comboSystem: {
        count: 0,
        lastHitTime: 0,
        timeWindow: 2000, // 2 seconds for combo counting
        active: false,
        resetTimer: 0 as unknown as ReturnType<typeof setTimeout>
    },
    scoreNotifications: [] as Array<{
        id: number;
        text: string;
        points: number;
        icon?: string | null;
        timestamp: number;
    }>,
    mutation: {
        t: 0,
        lastT: 0,
        position: new Vector3(),
        startTime: Date.now(),
        observationStartTime: 0,

        track: track as TubeGeometry,
        scale: 15,
        fov: 70,
        hits: 0,

        particles: randomData(500, track, 100, 1, () => 0.5 + Math.random() * 0.8),
        looptime: 40 * 1000, // default to fast mode
        binormal: new Vector3(),
        normal: new Vector3(),
        clock: new Clock(false),
        mouse: new Vector2(-250, 50),

        // Re-usable objects
        dummy: new Object3D(),
        ray: new Ray(),
        box: new Box3(),

        cancelExplosionTO: setTimeout(() => { }, 1),
        cancelLaserTO: setTimeout(() => { }, 1),

        // Add orbit control properties
        orbitCenter: new Vector3(),
        orbitTarget: new Vector3(),
        orbitDistance: 70,
        orbitSpeed: 0.001,
        previousPosition: new Vector3(),
        previousTime: Date.now(),
        pausedTime: 0,
        isPaused: false,
    },

    actions: {
        playAudio: null as unknown as (audio: HTMLAudioElement, volume?: number, loop?: boolean) => void,
        toggleSound: null as unknown as (sound?: boolean) => void,
        toggleInfoText: null as unknown as (show?: boolean) => void,
        shoot: null as unknown as () => void,
        test: null as unknown as (data: { size: number; offset: Vector3; scale: number; hit: any; distance: number; }) => boolean,
        updateMouse: null as unknown as (mouse: { clientX: number; clientY: number }) => void,
        init: null as unknown as (camera: PerspectiveCamera) => void,
        update: null as unknown as () => void,
        switchGameMode: null as unknown as () => void,
        switchSpeedMode: null as unknown as () => void,
        toggleObservationMode: null as unknown as (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => void,
        updateOrbitPosition: null as unknown as (horizontalAngle: number, verticalAngle: number) => void,
        resumeJourney: null as unknown as () => void,
        registerHit: null as unknown as (count: number, type: 'rock' | 'enemy') => void,
        addScoreNotification: null as unknown as (text: string, points: number, icon?: string | null) => void,
        restartGame: null as unknown as (switchMode: boolean) => void,
        showModal: null as unknown as (type: string) => void,
        hideModal: null as unknown as () => void,
        addStardust: null as unknown as () => void,
    },
})

gameStore.actions.restartGame = (switchMode: boolean) => {
    // Reset score
    gameStore.battleScore = 0;
    gameStore.stardust = 0;
    gameStore.loopCount = 0;

    // Reset time
    gameStore.mutation.startTime = Date.now();
    timeManager.actions.reset(false);

    // Clear entities
    gameStore.lasers = [];
    gameStore.explosions = [];
    gameStore.observedPoints = [];

    // Reset position
    gameStore.mutation.t = 0;
    const startPos = track.parameters.path.getPointAt(0);
    gameStore.mutation.position.copy(startPos.multiplyScalar(gameStore.mutation.scale));

    // Generate new entities
    if (gameStore.gameMode === GameMode.Battle) {
        gameStore.rocks = randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5);
        gameStore.enemies = randomData(10, track, 20, 15, 1);
        gameStore.initialRockCount = 100;
        gameStore.initialEnemyCount = 10;
    } else {
        gameStore.rocks = [];
        gameStore.enemies = [];
        gameStore.initialRockCount = 0;
        gameStore.initialEnemyCount = 0;
    }

    // If mode switch is needed
    if (switchMode) {
        gameStore.gameMode = gameStore.gameMode === GameMode.Battle ? GameMode.Explore : GameMode.Battle;
    }

    // Ensure reset and resume time
    timeManager.actions.reset(false);
    timeManager.actions.resume();
}

// Implement modal display method
gameStore.actions.showModal = (type: string) => {
    gameStore.modal.show = true;
    gameStore.modal.type = type;

    // Pause game time, but continue total time
    timeManager.actions.pause();
}

// Implement hide modal method
gameStore.actions.hideModal = () => {
    gameStore.modal.show = false;

    // Ensure game time resumes counting (only if not game over)
    if (gameStore.modal.type === 'switchConfirm') {
        timeManager.actions.resume();
    }
}


gameStore.actions.addStardust = () => {
    if (gameStore.gameMode === GameMode.Explore) {
        gameStore.stardust++;

        // Show a more visual notification
        gameStore.actions.addScoreNotification("Stardust +1", 1, "✧");
    }
}

gameStore.actions.addScoreNotification = (text, points, icon = null) => {
    const id = Date.now();
    gameStore.scoreNotifications.push({
        id,
        text,
        points,
        icon,
        timestamp: Date.now()
    });

    // Automatically clear after 3 seconds
    setTimeout(() => {
        gameStore.scoreNotifications = gameStore.scoreNotifications
            .filter(item => item.id !== id);
    }, 3000);
}

gameStore.actions.registerHit = (count: number, type: 'rock' | 'enemy') => {
    const now = Date.now();

    // Only process combos in Battle mode
    if (gameStore.gameMode !== GameMode.Battle) return;

    // Base points
    let basePoints = type === 'rock' ? count * 100 : count * 200;

    // Add points
    gameStore.battleScore += basePoints;

    // Display base score notification
    const itemText = type === 'rock'
        ? `${count} Stone${count > 1 ? 's' : ''}`
        : `${count} Enemy${count > 1 ? 'ies' : 'y'}`;

    gameStore.actions.addScoreNotification(`${itemText} +${basePoints}`, basePoints);

    // Handle combo
    if (now - gameStore.comboSystem.lastHitTime < gameStore.comboSystem.timeWindow) {
        gameStore.comboSystem.count += count;

        // Add combo bonus
        let bonusPoints = 0;
        if (gameStore.comboSystem.count >= 5) {
            bonusPoints = gameStore.comboSystem.count * 50;
            gameStore.actions.addScoreNotification(`${gameStore.comboSystem.count}x COMBO!`, bonusPoints);
        } else if (gameStore.comboSystem.count >= 3) {
            bonusPoints = gameStore.comboSystem.count * 30;
            gameStore.actions.addScoreNotification(`${gameStore.comboSystem.count}x Hit!`, bonusPoints);
        }

        // Add combo bonus points
        if (bonusPoints > 0) {
            gameStore.battleScore += bonusPoints;
        }
    } else {
        gameStore.comboSystem.count = count;
    }

    gameStore.comboSystem.lastHitTime = now;
    gameStore.comboSystem.active = true;

    // Reset combo timer
    clearTimeout(gameStore.comboSystem.resetTimer);
    gameStore.comboSystem.resetTimer = setTimeout(() => {
        gameStore.comboSystem.active = false;
        gameStore.comboSystem.count = 0;
    }, gameStore.comboSystem.timeWindow);
}

gameStore.actions.playAudio = (audio: HTMLAudioElement, volume = 1, loop = false) => {
    if (gameStore.sound) {
        audio.currentTime = 0
        audio.volume = volume
        audio.loop = loop
        audio.play()
    }
    else {
        audio.pause()
    }
}

gameStore.actions.toggleSound = (sound?: boolean) => {
    if (sound !== false && sound !== true) sound = !gameStore.sound
    gameStore.sound = sound
    gameStore.actions.playAudio(audio.engine, 1, true)
    gameStore.actions.playAudio(audio.engine2, 0.3, true)
    gameStore.actions.playAudio(audio.bg, 1, true)
}

gameStore.actions.init = (camera: PerspectiveCamera) => {
    gameStore.mutation.clock.start()
    gameStore.camera = camera
    gameStore.camera.far = 10000
    gameStore.actions.toggleSound(gameStore.sound)
}

gameStore.actions.shoot = () => {
    // Only allow shooting in Battle mode
    if (gameStore.gameMode === GameMode.Battle) {
        gameStore.lasers = [...gameStore.lasers, Date.now()]
        clearTimeout(gameStore.mutation.cancelLaserTO)
        gameStore.mutation.cancelLaserTO = setTimeout(() => gameStore.lasers = gameStore.lasers.filter(t => Date.now() - t <= 1000), 1000)
        gameStore.actions.playAudio(audio.zap, 0.5)
    }
    // In Explore mode, shooting is disabled
}

gameStore.actions.test = (data: { size: number; offset: Vector3; scale: number; hit: any; distance: number; }) => {
    const halfSize = data.size * data.scale / 2;

    gameStore.mutation.box.min.set(
        data.offset.x - halfSize,
        data.offset.y - halfSize,
        data.offset.z - halfSize
    );

    gameStore.mutation.box.max.set(
        data.offset.x + halfSize,
        data.offset.y + halfSize,
        data.offset.z + halfSize
    );

    data.hit.set(10000, 10000, 10000);

    const result = gameStore.mutation.ray.intersectBox(gameStore.mutation.box, data.hit);

    if (result) {
        data.distance = gameStore.mutation.ray.origin.distanceTo(data.hit);
        return true;
    }

    return false
}

gameStore.actions.updateMouse = ({ clientX, clientY }) => {
    if (gameStore.observationMode === ObservationMode.None) {
        gameStore.mutation.mouse.x = clientX - window.innerWidth / 2
        gameStore.mutation.mouse.y = clientY - window.innerHeight / 2
    }
}

gameStore.actions.update = () => {
    const { rocks, enemies, mutation, gameMode, speedMode } = gameStore

    const time = Date.now()
    const t = (mutation.t = ((time - mutation.startTime) % mutation.looptime) / mutation.looptime)

    if (mutation.lastT > 0.9 && t < 0.1) {
        gameStore.loopCount++
    }
    mutation.lastT = t

    mutation.position = track.parameters.path.getPointAt(t)
    mutation.position.multiplyScalar(mutation.scale)

    const speedFactor = SPEED_SETTINGS[speedMode].factor
    gameStore.camera.fov = 70 + (speedFactor - 1.0) * 10
    gameStore.camera.updateProjectionMatrix()

    // test for wormhole/warp
    let warping = false
    if (t > TRACK_POSITIONS.WARP_BEGIN && t < TRACK_POSITIONS.WARP_END) {
        if (!warping) {
            warping = true
            gameStore.actions.playAudio(audio.warp)
        }
    }
    else if (t > TRACK_POSITIONS.WARP_RESET) warping = false

    // Only process hits and collisions in Battle mode
    if (gameMode === GameMode.Battle) {
        // test for hits
        const rocksHit = rocks.filter(data => gameStore.actions.test(data))
        const enemiesHit = enemies.filter(data => gameStore.actions.test(data))
        const allHit = rocksHit.concat(enemiesHit)
        const previous = mutation.hits
        mutation.hits = allHit.length
        if (previous === 0 && mutation.hits) gameStore.actions.playAudio(audio.click)
        const lasers = gameStore.lasers
        if (mutation.hits && lasers.length && time - lasers[lasers.length - 1] < 100) {
            gameStore.actions.playAudio(new Audio(audio.mp3.explosion), 0.5)
            const updates: ExplosionData[] = []
            allHit.forEach(data => updates.push({
                time: Date.now(),
                ...data,
                color: 'white',
                particles: Array.from({ length: 20 }).fill(0).map(_ => ({
                    position: new Vector3(),
                    dPos: new Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).normalize().multiplyScalar(.40),
                })),
            }))
            allHit.forEach(data => updates.push({
                time: Date.now(),
                ...data,
                color: 'orange',
                particles: Array.from({ length: 20 }).fill(0).map(_ => ({
                    position: new Vector3(),
                    dPos: new Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2).normalize().multiplyScalar(.60),
                })),
            }))
            gameStore.explosions = [...gameStore.explosions, ...updates]

            clearTimeout(gameStore.mutation.cancelExplosionTO)
            gameStore.mutation.cancelExplosionTO = setTimeout(() => {
                gameStore.explosions = gameStore.explosions.filter(({ time }) => Date.now() - time <= 1000)
            }
                , 1000)

            if (rocksHit.length > 0) {
                gameStore.actions.registerHit(rocksHit.length, 'rock');
            }

            if (enemiesHit.length > 0) {
                gameStore.actions.registerHit(enemiesHit.length, 'enemy');
            }

            gameStore.rocks = gameStore.rocks.filter(rock => !rocksHit.find(r => r.guid === rock.guid));
            gameStore.enemies = gameStore.enemies.filter(enemy => !enemiesHit.find(e => e.guid === enemy.guid));

        }
    } else {
        // In Explore mode, set hits to 0 to avoid targeting UI
        mutation.hits = 0
    }

}

// Completely reset all game state when switching modes
gameStore.actions.switchGameMode = () => {
    // Store current mode before switching
    const previousMode = gameStore.gameMode;

    // Toggle between Battle and Explore modes
    gameStore.gameMode = gameStore.gameMode === GameMode.Battle ? GameMode.Explore : GameMode.Battle;

    gameStore.chainweb3D = generateChainweb3D(30, track, TRACK_POSITIONS.Chainweb3D, gameStore.gameMode === GameMode.Battle);

    // Reset score,loopCount regardless of mode
    gameStore.battleScore = 0;
    gameStore.loopCount = 0

    // Reset time by updating startTime to current time
    gameStore.mutation.startTime = Date.now();

    // Reset timer
    timeManager.actions.reset(false);

    // Clear existing entities
    gameStore.lasers = [];
    gameStore.explosions = [];

    // Reset combo system
    gameStore.comboSystem.count = 0;
    gameStore.comboSystem.active = false;
    gameStore.comboSystem.lastHitTime = 0;
    clearTimeout(gameStore.comboSystem.resetTimer);

    // Clear score notifications
    gameStore.scoreNotifications = [];

    // Reset player position to the start of the track (t=0)
    gameStore.mutation.t = 0;

    // Immediately update position to match t=0
    const startPos = track.parameters.path.getPointAt(0);
    gameStore.mutation.position.copy(startPos.multiplyScalar(gameStore.mutation.scale));

    // Regenerate game entities based on mode
    if (gameStore.gameMode === GameMode.Battle) {
        // Full set of rocks and enemies for Battle mode
        gameStore.rocks = randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5);
        gameStore.enemies = randomData(10, track, 20, 15, 1);

        gameStore.initialRockCount = 100;
        gameStore.initialEnemyCount = 10;

        // Reset particles to full density for Battle mode
        gameStore.mutation.particles = randomData(500, track, 100, 1, () => 0.5 + Math.random() * 0.8);
    } else {
        // Empty arrays for Explore mode
        gameStore.rocks = [];
        gameStore.enemies = [];

        gameStore.initialRockCount = 0;
        gameStore.initialEnemyCount = 0;

        // Reduce particles to 10% for a cleaner Explore mode
        gameStore.mutation.particles = randomData(50, track, 100, 1, () => 0.5 + Math.random() * 0.8);
    }

    console.log(`Switched from ${previousMode} to ${gameStore.gameMode} mode, game fully reset`);
}

gameStore.actions.switchSpeedMode = () => {
    const currentT = gameStore.mutation.t;
    const now = Date.now();

    if (gameStore.speedMode === SpeedMode.Fast) {
        gameStore.speedMode = SpeedMode.Slow;
    } else if (gameStore.speedMode === SpeedMode.Slow) {
        gameStore.speedMode = SpeedMode.Normal;
    } else {
        gameStore.speedMode = SpeedMode.Fast;
    }

    const targetLooptime = SPEED_SETTINGS[gameStore.speedMode].looptime;
    gameStore.mutation.startTime = now - (currentT * targetLooptime);
    gameStore.mutation.looptime = targetLooptime;

    // Debug information
    console.log(`Speed changed to ${gameStore.speedMode} (${SPEED_SETTINGS[gameStore.speedMode].label})`);
}

const originalSwitchGameMode = gameStore.actions.switchGameMode;
gameStore.actions.switchGameMode = () => {
    // If game is in progress (loopCount > 0) and modal is not shown
    if (gameStore.loopCount > 0 && !gameStore.modal.show) {
        // Show switch confirmation dialog
        gameStore.actions.showModal('switchConfirm');
    } else {
        // Direct switch
        originalSwitchGameMode();
    }
}

// Update the update function to handle observation mode
const originalUpdate = gameStore.actions.update;
gameStore.actions.update = () => {
    const { observationMode, mutation } = gameStore;

    if (observationMode === ObservationMode.None) {
        // Normal update
        originalUpdate();
    } else if (observationMode === ObservationMode.Orbiting) {
        // In orbiting mode, update camera position based on orbit parameters

        // Calculate orbit position
        const horizontalRadius = mutation.orbitDistance * Math.cos(gameStore.orbitHeight);
        const x = mutation.orbitCenter.x + horizontalRadius * Math.cos(gameStore.orbitAngle);
        const z = mutation.orbitCenter.z + horizontalRadius * Math.sin(gameStore.orbitAngle);
        const y = mutation.orbitCenter.y + mutation.orbitDistance * Math.sin(gameStore.orbitHeight);

        mutation.position.set(x, y, z);

        // Automatically slowly rotate if mouse input is not controlling it
        gameStore.orbitAngle += mutation.orbitSpeed;

        // Point camera at the center point
        gameStore.camera.position.copy(mutation.position);
        gameStore.camera.lookAt(mutation.orbitCenter);
    }

    // Check if total loops reached (ensure check only happens once)
    if (gameStore.loopCount >= gameStore.totalLoops && !gameStore.modal.show) {
        // Show game over dialog
        gameStore.actions.showModal('gameOver');
    }
}

// Add the toggle info text function
gameStore.actions.toggleInfoText = (show?: boolean) => {
    if (show !== false && show !== true) show = !gameStore.showInfoText
    gameStore.showInfoText = show
}

function checkStardustCollection() {
    if (gameStore.gameMode !== GameMode.Explore) return;

    // Safety check for currentPointOfInterest
    const poi = gameStore.currentPointOfInterest;
    if (!poi) return;

    if (gameStore.observationMode !== ObservationMode.None &&
        !gameStore.observedPoints.includes(poi)) {

        const observationStartTime = gameStore.mutation.observationStartTime || 0;
        const observationTime = Date.now() - observationStartTime;

        if (observationTime >= 20000) { // 20 seconds
            gameStore.observedPoints.push(poi);
            gameStore.actions.addStardust();
            gameStore.actions.addScoreNotification("Stardust +1", 1, "✧");
        }
    }
}

// Modify observation mode toggle method to record start time
const originalToggleObservationMode = gameStore.actions.toggleObservationMode;
gameStore.actions.toggleObservationMode = (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => {
    // Record observation start time
    if (pointOfInterestKey && !gameStore.observedPoints.includes(pointOfInterestKey)) {
        gameStore.mutation.observationStartTime = Date.now();
    }

    // Call original method
    originalToggleObservationMode(pointOfInterestKey);

    // If exiting observation mode, check if can collect card
    if (!pointOfInterestKey && gameStore.mutation.observationStartTime) {
        checkStardustCollection();
    }
}

export type GameStore = typeof gameStore

function randomData(count: number, track: TubeGeometry, radius: number, size: number, scale: number | (() => number)) {
    return new Array(count).fill({}).map(() => {
        const t = Math.random()
        const pos = track.parameters.path.getPointAt(t)
        pos.multiplyScalar(15)

        // Modify enemy position generation: limit vertical distance
        // Horizontal direction still maintains omnidirectional randomness
        const horizontalOffset = new Vector3(
            -radius + Math.random() * radius * 2,
            0,  // Set to zero first, then add limited vertical offset later
            -radius + Math.random() * radius * 2
        );

        // Vertical offset is controlled within a smaller range to reduce enemies generated too far below the track
        // Control vertical offset between -radius/2 and radius/2 to reduce distance of enemies below
        const verticalOffset = -radius / 2 + Math.random() * radius;
        horizontalOffset.y = verticalOffset;

        const offset = pos.clone().add(horizontalOffset);
        const speed = 0.1 + Math.random()
        return {
            guid: guid++,
            scale: typeof scale === 'function' ? scale() : scale,
            size,
            offset,
            pos,
            speed,
            radius,
            t,
            hit: new Vector3(),
            distance: 1000,
            rotation: new Euler(Math.random(), Math.random(), Math.random())
        }
    })
}

/**
 * Calculate position and rotation at a specific point on the track
 * @param track Track geometry
 * @param t Track parameter t (0-1)
 * @param offsetDistance Vertical offset distance (optional)
 * @param rotationAdjustment Rotation adjustment function (optional)
 * @returns Position and rotation information
 */
function calculateTrackPositionAndRotation(
    track: TubeGeometry,
    t: number,
    offsetDistance: number = 0,
    rotationAdjustment: ((matrix: Matrix4) => void) | null = null
) {
    const pos = track.parameters.path.getPointAt(t);
    pos.multiplyScalar(15);

    const segments = track.tangents.length;
    const pickt = t * segments;
    const pick = Math.floor(pickt);

    const lookAt = track.parameters.path.getPointAt(
        (t + 1 / track.parameters.path.getLength()) % 1
    ).multiplyScalar(15);

    // Create orientation matrix
    const matrix = new Matrix4().lookAt(pos, lookAt, track.binormals[pick]);

    // Apply custom rotation adjustment (if provided)
    if (rotationAdjustment) {
        rotationAdjustment(matrix);
    }

    // Extract rotation
    const rotation = new Euler().setFromRotationMatrix(matrix);

    // Add offset if needed
    if (offsetDistance !== 0) {
        const offset = track.binormals[pick].clone().multiplyScalar(offsetDistance);
        pos.add(offset);
    }

    return { position: pos, rotation };
}

function generateRings(count: number, track: TubeGeometry, startT: number = TRACK_POSITIONS.RINGS) {
    const temp = [];
    let t = startT;

    // Two adjustable parameters to control ring size variations
    const baseScale = 15 + Math.random() * 10; // Base scale size (15-25)
    const scaleVariation = 0.5 + Math.random() * 1.5;  // Scale variation range (0.5-2)

    // Add random wave parameters
    const waveFactor = 0.05 + Math.random() * 0.15; // Wave factor (0.05-0.2)
    const waveFrequency = 0.05 + Math.random() * 0.25; // Wave frequency (0.05-0.3)

    for (let i = 0; i < count; i++) {
        // Add a small random offset for each ring to make distribution more natural
        t += 0.001;

        // Get position and rotation
        const { position, rotation } = calculateTrackPositionAndRotation(track, t);

        // Calculate scale using new parameters, adding randomness and wave effect
        const scale = baseScale +
            (i * scaleVariation * Math.sin(i * waveFrequency) * Math.PI / 2) +
            (Math.random() * waveFactor * baseScale);

        temp.push({
            position: position.toArray(),
            rotation,
            scale: scale
        });
    }

    return temp;
}

function generateChainweb3D(count: number, track: TubeGeometry, startT: number = TRACK_POSITIONS.Chainweb3D, isBattleMode: boolean = true) {
    const temp = [];
    let t = startT;

    const actualCount = isBattleMode ? Math.floor(count / 3) : count;
    const stepMultiplier = isBattleMode ? 3 : 1;

    for (let i = 0; i < actualCount; i++) {
        t += 0.004 * stepMultiplier;
        const { position, rotation } = calculateTrackPositionAndRotation(track, t);

        temp.push({
            position: position.toArray(),
            rotation,
            scale: 100
        });
    }

    return temp;
}

function generatePetersenGraph(track: TubeGeometry) {
    const temp = [];

    for (const t of TRACK_POSITIONS.PETERSEN_GRAPH) {
        const { position, rotation } = calculateTrackPositionAndRotation(track, t);

        temp.push({
            position: position.toArray(),
            rotation,
            scale: 30
        });
    }

    return temp;
}

function generateInfoLabels(track: TubeGeometry) {
    const labels: { position: Vector3Tuple; rotation: { x: number; y: number; z: number }; scale: number; text: string; color: string }[] = [];

    // Process all info labels
    INFO_LABELS.forEach(label => {
        const t = label.t;

        // Get position on the track
        const { position, rotation } = calculateTrackPositionAndRotation(
            track,
            t,
            -10,
            (matrix) => {
                matrix.multiply(new Matrix4().makeRotationY(Math.PI));
                // Add a slight rotation to face labels more toward the camera
                matrix.multiply(new Matrix4().makeRotationX(-Math.PI / 12));
            }
        );

        labels.push({
            position: position.toArray(),
            rotation: {
                x: rotation.x,
                y: rotation.y,
                z: rotation.z
            },
            scale: 4.5,
            text: label.text,
            color: label.color
        });
    });

    return labels;
}

function generateSpaceStationData(track: TubeGeometry, startT: number = TRACK_POSITIONS.SPACE_STATION) {
    const t = startT;

    // Get position and rotation with offset
    // Add fourth parameter to make the space station perpendicular to the track
    const { position, rotation } = calculateTrackPositionAndRotation(track, t, 100);

    return {
        position: position.toArray(),
        rotation: rotation,
        scale: 8
    };
}

function generateSpaceProbeData(track: TubeGeometry, startT: number = TRACK_POSITIONS.SPACE_PROBE) {
    const t = startT;

    // Get position and rotation with offset
    const { position, rotation } = calculateTrackPositionAndRotation(track, t, 70);

    return {
        position: position.toArray(),
        rotation: rotation,
        scale: 3
    };
}

const camera = shallowRef(new PerspectiveCamera())
onMounted(() => {
    gameStore.actions.init(camera.value)
})

gameStore.actions.toggleObservationMode = (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => {
    // Only available in explore mode
    if (gameStore.gameMode !== GameMode.Explore) return;

    const { mutation } = gameStore;

    // If already in observation mode or no point specified, reset to normal journey
    if (gameStore.observationMode !== ObservationMode.None || !pointOfInterestKey) {
        return gameStore.actions.resumeJourney();
    }

    // Get point of interest data
    const poi = POINTS_OF_INTEREST[pointOfInterestKey];
    if (!poi) return;

    // Store current position and pause time info
    mutation.previousPosition.copy(mutation.position);
    mutation.previousTime = Date.now();
    mutation.isPaused = true;

    // Set up orbit parameters
    mutation.orbitCenter.copy(track.parameters.path.getPointAt(poi.trackPosition).multiplyScalar(mutation.scale));
    mutation.orbitDistance = poi.orbitDistance;
    mutation.orbitSpeed = poi.orbitSpeed;

    // Initialize orbit angle
    gameStore.orbitAngle = 0;
    gameStore.orbitHeight = 0;

    // Set observation mode and current point of interest
    gameStore.observationMode = ObservationMode.Orbiting;
    gameStore.currentPointOfInterest = pointOfInterestKey;

    // Force game to pause movement along the track
    mutation.pausedTime = Date.now() - mutation.previousTime;

    console.log(`Now observing: ${poi.name}`);
}

gameStore.actions.updateOrbitPosition = (horizontalAngle: number, verticalAngle: number) => {
    if (gameStore.observationMode === ObservationMode.Orbiting) {
        // Update orbit angles based on input
        gameStore.orbitAngle = horizontalAngle;
        gameStore.orbitHeight = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, verticalAngle));
    }
}

gameStore.actions.resumeJourney = () => {
    const { mutation } = gameStore;

    // Only do something if we're in observation mode
    if (gameStore.observationMode === ObservationMode.None) return;

    // Reset observation mode
    gameStore.observationMode = ObservationMode.None;
    gameStore.currentPointOfInterest = null;

    // Resume normal movement
    if (mutation.isPaused) {
        // Update start time to account for the paused duration
        mutation.startTime += (Date.now() - mutation.previousTime);
        mutation.isPaused = false;
    }

    console.log("Resumed journey");
}

// Update the update function to handle observation mode
const originalUpdate = gameStore.actions.update;
gameStore.actions.update = () => {
    const { observationMode, mutation } = gameStore;

    if (observationMode === ObservationMode.None) {
        // Normal update
        originalUpdate();
    } else if (observationMode === ObservationMode.Orbiting) {
        // In orbiting mode, update camera position based on orbit parameters

        // Calculate orbit position
        const horizontalRadius = mutation.orbitDistance * Math.cos(gameStore.orbitHeight);
        const x = mutation.orbitCenter.x + horizontalRadius * Math.cos(gameStore.orbitAngle);
        const z = mutation.orbitCenter.z + horizontalRadius * Math.sin(gameStore.orbitAngle);
        const y = mutation.orbitCenter.y + mutation.orbitDistance * Math.sin(gameStore.orbitHeight);

        mutation.position.set(x, y, z);

        // Automatically slowly rotate if mouse input is not controlling it
        gameStore.orbitAngle += mutation.orbitSpeed;

        // Point camera at the center point
        gameStore.camera.position.copy(mutation.position);
        gameStore.camera.lookAt(mutation.orbitCenter);
    }

    // Check if total loops reached (ensure check only happens once)
    if (gameStore.loopCount >= gameStore.totalLoops && !gameStore.modal.show) {
        // Show game over dialog
        gameStore.actions.showModal('gameOver');
    }
}

// Add the toggle info text function
gameStore.actions.toggleInfoText = (show?: boolean) => {
    if (show !== false && show !== true) show = !gameStore.showInfoText
    gameStore.showInfoText = show
}

function checkStardustCollection() {
    if (gameStore.gameMode !== GameMode.Explore) return;

    // Safety check for currentPointOfInterest
    const poi = gameStore.currentPointOfInterest;
    if (!poi) return;

    if (gameStore.observationMode !== ObservationMode.None &&
        !gameStore.observedPoints.includes(poi)) {

        const observationStartTime = gameStore.mutation.observationStartTime || 0;
        const observationTime = Date.now() - observationStartTime;

        if (observationTime >= 20000) { // 20 seconds
            gameStore.observedPoints.push(poi);
            gameStore.actions.addStardust();
            gameStore.actions.addScoreNotification("Stardust +1", 1, "✧");
        }
    }
}

// Modify observation mode toggle method to record start time
const originalToggleObservationMode = gameStore.actions.toggleObservationMode;
gameStore.actions.toggleObservationMode = (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => {
    // Record observation start time
    if (pointOfInterestKey && !gameStore.observedPoints.includes(pointOfInterestKey)) {
        gameStore.mutation.observationStartTime = Date.now();
    }

    // Call original method
    originalToggleObservationMode(pointOfInterestKey);

    // If exiting observation mode, check if can collect card
    if (!pointOfInterestKey && gameStore.mutation.observationStartTime) {
        checkStardustCollection();
    }
}