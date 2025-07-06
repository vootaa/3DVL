uniform float uEvolutionProgress;

varying vec3 vColor;

void main()
{
    // Create sharp, thin points for precise ring lines
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 4.0); // Higher power for sharper falloff
    
    // Very concentrated bright core for thin line effect
    float core = 1.0 - distance(gl_PointCoord, vec2(0.5)) * 3.0; // Tighter core
    core = max(0.0, core);
    core = pow(core, 6.0); // Very sharp core
    
    // Combine for precise, thin bright lines
    float finalStrength = strength + core * 4.0; // Much brighter concentrated core
    finalStrength = min(finalStrength, 1.0);
    
    // Apply evolution progress to particle visibility
    finalStrength *= smoothstep(0.0, 1.0, uEvolutionProgress);
    
    // Boost color intensity for brilliant ring effect
    vec3 color = vColor * (1.0 + finalStrength * 2.0);
    
    gl_FragColor = vec4(color, finalStrength);
}
