import { reactive, shallowRef, onMounted } from 'vue'
import * as audio from './audio'
import type { ExplosionData } from './3d/Explosions.vue'
import { Box3, Clock, Euler, Matrix4, Object3D, PerspectiveCamera, Ray, TubeGeometry, Vector2, Vector3 } from 'three'
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
    PETERSEN_GRAPH: [0.1, 0.25, 0.55, 0.7],
    Chainweb3D: 0.4,
    WARP_BEGIN: 0.3,
    WARP_END: 0.4,
    WARP_RESET: 0.5,
    RINGS: 0.6,
    SPACE_STATION: 0.8,
    LOOP: 1.0
};

// Define points of interest for observation
export const POINTS_OF_INTEREST = {
    SPACE_STATION: {
        name: 'Space Station',
        trackPosition: TRACK_POSITIONS.SPACE_STATION,
        orbitDistance: 70,
        orbitSpeed: 0.001
    },
    CHAINWEB_3D: {
        name: 'Chainweb 3D',
        trackPosition: TRACK_POSITIONS.Chainweb3D,
        orbitDistance: 120,
        orbitSpeed: 0.0015
    },
    PETERSEN_GRAPH: {
        name: 'Petersen Graph',
        trackPosition: TRACK_POSITIONS.PETERSEN_GRAPH[0],
        orbitDistance: 50,
        orbitSpeed: 0.002
    }
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
const track = new TubeGeometry(spline, 200, 0.25, 12, true)

export const gameStore = reactive({
    spline,
    points: 0,
    health: 100,
    loopCount: 0,
    lasers: [] as number[],
    explosions: [] as ExplosionData[],
    rocks: randomData(100, track, 150, 8, () => 1 + Math.random() * 2.5),
    enemies: randomData(10, track, 20, 15, 1),
    rings: generateRings(30, track),
    chainweb3D: generateChainweb3D(30, track),
    PetersenGraphGroup: generatePetersenGraph(track),
    spaceStation: generateSpaceStationData(track),
    camera: new PerspectiveCamera(),
    sound: false,
    gameMode: GameMode.Battle, // Default to Battle mode
    speedMode: SpeedMode.Fast, // Default to Fast mode
    timeManager,
    observationMode: ObservationMode.None,
    currentPointOfInterest: null as keyof typeof POINTS_OF_INTEREST | null,
    orbitAngle: 0,
    orbitHeight: 0,
    mutation: {
        t: 0,
        lastT: 0,
        position: new Vector3(),
        startTime: Date.now(),

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
        playAudio: (audio: HTMLAudioElement, volume?: number, loop?: boolean) => void 0,
        toggleSound: (sound?: boolean) => void 0,
        shoot: () => void 0,
        test: (data: { size: number; offset: Vector3; scale: number; hit: any; distance: number }) => any,
        updateMouse: (mouse: { clientX: number; clientY: number }) => void 0,
        init: (camera: PerspectiveCamera) => void 0,
        update: () => void 0,
        switchGameMode: () => void 0,
        switchSpeedMode: () => void 0,
        toggleObservationMode: (pointOfInterestKey: keyof typeof POINTS_OF_INTEREST | null) => void 0,
        updateOrbitPosition: (horizontalAngle: number, verticalAngle: number) => void 0,
        resumeJourney: () => void 0,
    },
})

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

gameStore.actions.test = (data) => {
    gameStore.mutation.box.min.copy(data.offset)
    gameStore.mutation.box.max.copy(data.offset)
    gameStore.mutation.box.expandByScalar(data.size * data.scale)
    data.hit.set(10000, 10000, 10000)
    const result = gameStore.mutation.ray.intersectBox(gameStore.mutation.box, data.hit)
    data.distance = gameStore.mutation.ray.origin.distanceTo(data.hit)
    return result
}

gameStore.actions.updateMouse = ({ clientX, clientY }) => {
    gameStore.mutation.mouse.x = clientX - window.innerWidth / 2
    gameStore.mutation.mouse.y = clientY - window.innerHeight / 2
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

    const speedFactor = SPEED_SETTINGS[speedMode].factor
    mutation.position.multiplyScalar(mutation.scale)
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
        const rocksHit = rocks.filter(gameStore.actions.test)
        const enemiesHit = enemies.filter(gameStore.actions.test)
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
            gameStore.points = gameStore.points + rocksHit.length * 100 + enemiesHit.length * 200,
                gameStore.rocks = gameStore.rocks.filter(rock => !rocksHit.find(r => r.guid === rock.guid)),
                gameStore.enemies = gameStore.enemies.filter(enemy => !enemiesHit.find(e => e.guid === enemy.guid))
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
    gameStore.gameMode = gameStore.gameMode === GameMode.Battle
        ? GameMode.Explore
        : GameMode.Battle;

    // Reset score,loopCount regardless of mode
    gameStore.points = 0;
    gameStore.loopCount = 0

    // Reset time by updating startTime to current time
    gameStore.mutation.startTime = Date.now();

    // Reset timer
    timeManager.actions.reset(false);

    // Clear existing entities
    gameStore.lasers = [];
    gameStore.explosions = [];

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

        // Reset particles to full density for Battle mode
        gameStore.mutation.particles = randomData(500, track, 100, 1, () => 0.5 + Math.random() * 0.8);
    } else {
        // Empty arrays for Explore mode
        gameStore.rocks = [];
        gameStore.enemies = [];

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

export type GameStore = typeof gameStore

function randomData(count: number, track: TubeGeometry, radius: number, size: number, scale: number | (() => number)) {
    return new Array(count).fill({}).map(() => {
        const t = Math.random()
        const pos = track.parameters.path.getPointAt(t)
        pos.multiplyScalar(15)
        const offset = pos
            .clone()
            .add(new Vector3(-radius + Math.random() * radius * 2, -radius + Math.random() * radius * 2, -radius + Math.random() * radius * 2))
        const speed = 0.1 + Math.random()
        return { guid: guid++, scale: typeof scale === 'function' ? scale() : scale, size, offset, pos, speed, radius, t, hit: new Vector3(), distance: 1000, rotation: new Euler(Math.random(), Math.random(), Math.random()) }
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

    for (let i = 0; i < count; i++) {
        t += 0.002;
        const { position, rotation } = calculateTrackPositionAndRotation(track, t);

        temp.push({
            position: position.toArray(),
            rotation,
            scale: 30 + i * 2 * Math.sin(i * 0.1) * Math.PI / 2
        });
    }

    return temp;
}

function generateChainweb3D(count: number, track: TubeGeometry, startT: number = TRACK_POSITIONS.Chainweb3D) {
    const temp = [];
    let t = startT;

    for (let i = 0; i < count; i++) {
        t += 0.004;
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

function generateSpaceStationData(track: TubeGeometry, startT: number = TRACK_POSITIONS.SPACE_STATION) {
    const t = startT;

    // Get position and rotation with offset
    // Add fourth parameter to make the space station perpendicular to the track
    const { position, rotation } = calculateTrackPositionAndRotation(track, t, 50);

    return {
        position: position.toArray(),
        rotation: rotation,
        scale: 10
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

gameStore.actions.updateOrbitPosition = (horizontalAngle, verticalAngle) => {
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

        // Don't advance the track position when in observation mode
        mutation.t = (mutation.t + 0.0001) % 1; // Small increment to prevent timeline stalling completely
    }
}