uniform vec2 iResolution;
uniform float iTime;

varying vec4 vFragColor;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;

  // Directly use UV coordinates, add radial effect
  vec2 center = vec2(0.5, 0.5);
  float radius = length(uv - center);

  // Modify color function to fit circular shape
  float g = pow(1.0 - sqrt(abs(cos(radius * 8.0 + iTime * 0.2))), sin(iTime) + 2.0);
  float b = pow(1.0 - sin(radius * 4.0 + iTime), cos(iTime) + 2.0);
  float r = sin(iTime + radius * 4.0 + sin(radius * 5.0 + iTime));

  fragColor = vec4(r, g, b, 0.1);
}

void main() {
  mainImage(vFragColor, (position.xy + vec2(0.15, 0.15)) * iResolution * 0.75);

  vec3 offset = vec3(normal) * clamp(vFragColor.a, 0.1, 1.);
  vec4 modelPosition = modelMatrix * vec4(position + offset, 1.0);
  vec4 viewPosition = viewMatrix * modelPosition;

  gl_Position = projectionMatrix * viewPosition;
}

/*
  Modified from TresJS shader example: 
*/

/** SHADERDATA
{
	"title": "Sinusoidal 2 for TresJS",
    "author": "andretchen0",
	"description": "Simple shader made for this TresJS lab",
    "href": "https://lab.tresjs.org"
}
*/