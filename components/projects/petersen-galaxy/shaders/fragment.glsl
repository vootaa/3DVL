varying vec3 vColor;

void main()
{
    // Create a more defined disc shape
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 3.0);
    
    // Add a brighter core for more luminous effect
    float core = 1.0 - distance(gl_PointCoord, vec2(0.5)) * 2.0;
    core = max(0.0, core);
    core = pow(core, 8.0);
    
    // Combine base strength with bright core
    float finalStrength = strength + core * 0.5;
    
    // Color
    vec3 color = mix(vec3(0.0), vColor, finalStrength);
    gl_FragColor = vec4(color, finalStrength);
}
