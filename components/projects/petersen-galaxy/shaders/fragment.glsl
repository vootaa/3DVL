varying vec3 vColor;

void main()
{
    // Create extremely bright, sharp points for clear ring visibility
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 1.5); // Softer falloff for broader brightness
    
    // Very intense bright core for ring effect
    float core = 1.0 - distance(gl_PointCoord, vec2(0.5)) * 1.5;
    core = max(0.0, core);
    core = pow(core, 2.0);
    
    // Combine for maximum brightness - rings should be very visible
    float finalStrength = strength + core * 3.0; // Much brighter
    finalStrength = min(finalStrength, 1.0);
    
    // Boost color intensity for brilliant ring effect
    vec3 color = vColor * (1.5 + finalStrength);
    
    gl_FragColor = vec4(color, finalStrength);
}
