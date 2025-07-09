uniform vec2 iResolution;
uniform float iTime;

varying vec4 vFragColor;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    float g = pow(1.0 - sqrt(abs(cos(uv.y + uv.x + iTime * 0.1))), sin(iTime) + 2.0);
    float b = pow(1.0 - sin(uv.y + iTime), cos(iTime) + 2.0 );
    float r = sin(iTime + uv.y + sin(uv.y + iTime));

    fragColor = vec4(r, g, b, 0.);
}

void main() {
    mainImage(vFragColor, (position.xy + vec2(0.15, 0.15)) * iResolution *0.75);
  
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