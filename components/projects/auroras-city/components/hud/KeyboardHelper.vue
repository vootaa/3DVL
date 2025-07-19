<template>
    <div class="keyboard-hud">
        <div class="hud-title">
            <i class="i-carbon-keyboard hud-title-icon" aria-hidden="true" />
            Keyboard Controls
        </div>
        <ul>
            <li><b>W/S</b>: Move Forward/Backward</li>
            <li><b>A/D</b>: Move Left/Right</li>
            <li><b>I/K</b>: Move Up/Down</li>
            <li><b>↑/↓</b>: Look Up/Down</li>
            <li><b>←/→</b>: Turn Left/Right</li>
            <li><b>Q/E</b>: Turn Left/Right</li>
        </ul>
    </div>
</template>

<style scoped>
.keyboard-hud {
    position: fixed;
    left: 24px;
    bottom: 24px;
    background: rgba(10, 10, 20, 0.85);
    color: #fff;
    padding: 16px 20px;
    border-radius: 10px;
    font-size: 12px;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    pointer-events: none;
}

.hud-title {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.hud-title-icon {
    font-size: 18px;
    color: #00ccff;  filter: drop-shadow(0 0 4px #00ccff88);
}

ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

li {
    margin-bottom: 4px;
}

b {
    color: #00ccff;
}
</style>