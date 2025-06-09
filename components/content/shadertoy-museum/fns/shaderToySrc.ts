const gamesOfSinus = `
// NOTE: https://www.shadertoy.com/view/M32BD1
// color pallette inspired by https://www.shadertoy.com/view/ls3Xzn 
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    
    float ph = 25. + (1. - uv.x) * 20.;
    float amp = 0.02 + uv.x / 5.;
    float y = 0.5 + sin(uv.x * ph + iTime) * amp;
    float c1 = 1. - smoothstep(0.003, 0.003 + exp(-(1. - uv.x) * 4.), abs(uv.y - y));
    float c2 = 1. - smoothstep(0.003, 0.003 + exp(-(uv.x) * 4.), abs(uv.y - y));
    float r = pow(1.0 - sqrt(abs(uv.y - c1)), sin(iTime) + 2.0);
    float g = pow(1.0 - sqrt(abs(uv.y - c2)), cos(iTime) + 2.0 );
    float b = 1.5 * (r+g);

    fragColor = vec4(r, g, b, r + g + b);
}
/** SHADERDATA
{
	"title": "The games of sinus :)",
	"author": "cesio",
	"description": "Sinusoid, color pallette inspired by https://www.shadertoy.com/view/ls3Xzn",
    "href": "https://www.shadertoy.com/view/M32BD1"
}
*/
`

const mandelbulb = `
// NOTE: https://www.shadertoy.com/view/MdXSWn
// Created by evilryu
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.


// whether turn on the animation
//#define phase_shift_on 

float stime, ctime;
 void ry(inout vec3 p, float a){  
 	float c,s;vec3 q=p;  
  	c = cos(a); s = sin(a);  
  	p.x = c * q.x + s * q.z;  
  	p.z = -s * q.x + c * q.z; 
 }  

float pixel_size = 0.0;

/* 

z = r*(sin(theta)cos(phi) + i cos(theta) + j sin(theta)sin(phi)

zn+1 = zn^8 +c

z^8 = r^8 * (sin(8*theta)*cos(8*phi) + i cos(8*theta) + j sin(8*theta)*sin(8*theta)

zn+1' = 8 * zn^7 * zn' + 1

*/

vec3 mb(vec3 p) {
	p.xyz = p.xzy;
	vec3 z = p;
	vec3 dz=vec3(0.0);
	float power = 8.0;
	float r, theta, phi;
	float dr = 1.0;
	
	float t0 = 1.0;
	for(int i = 0; i < 7; ++i) {
		r = length(z);
		if(r > 2.0) continue;
		theta = atan(z.y / z.x);
        #ifdef phase_shift_on
		phi = asin(z.z / r) + iTime*0.1;
        #else
        phi = asin(z.z / r);
        #endif
		
		dr = pow(r, power - 1.0) * dr * power + 1.0;
	
		r = pow(r, power);
		theta = theta * power;
		phi = phi * power;
		
		z = r * vec3(cos(theta)*cos(phi), sin(theta)*cos(phi), sin(phi)) + p;
		
		t0 = min(t0, r);
	}
	return vec3(0.5 * log(r) * r / dr, t0, 0.0);
}

 vec3 f(vec3 p){ 
	 ry(p, iTime*0.2);
     return mb(p); 
 } 


 float softshadow(vec3 ro, vec3 rd, float k ){ 
     float akuma=1.0,h=0.0; 
	 float t = 0.01;
     for(int i=0; i < 50; ++i){ 
         h=f(ro+rd*t).x; 
         if(h<0.001)return 0.02; 
         akuma=min(akuma, k*h/t); 
 		 t+=clamp(h,0.01,2.0); 
     } 
     return akuma; 
 } 

vec3 nor( in vec3 pos )
{
    vec3 eps = vec3(0.001,0.0,0.0);
	return normalize( vec3(
           f(pos+eps.xyy).x - f(pos-eps.xyy).x,
           f(pos+eps.yxy).x - f(pos-eps.yxy).x,
           f(pos+eps.yyx).x - f(pos-eps.yyx).x ) );
}

vec3 intersect( in vec3 ro, in vec3 rd )
{
    float t = 1.0;
    float res_t = 0.0;
    float res_d = 1000.0;
    vec3 c, res_c;
    float max_error = 1000.0;
	float d = 1.0;
    float pd = 100.0;
    float os = 0.0;
    float step = 0.0;
    float error = 1000.0;
    
    for( int i=0; i<48; i++ )
    {
        if( error < pixel_size*0.5 || t > 20.0 )
        {
        }
        else{  // avoid broken shader on windows
        
            c = f(ro + rd*t);
            d = c.x;

            if(d > os)
            {
                os = 0.4 * d*d/pd;
                step = d + os;
                pd = d;
            }
            else
            {
                step =-os; os = 0.0; pd = 100.0; d = 1.0;
            }

            error = d / t;

            if(error < max_error) 
            {
                max_error = error;
                res_t = t;
                res_c = c;
            }
        
            t += step;
        }

    }
	if( t>20.0/* || max_error > pixel_size*/ ) res_t=-1.0;
    return vec3(res_t, res_c.y, res_c.z);
}

 void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
 { 
    vec2 q=fragCoord.xy/iResolution.xy; 
 	vec2 uv = -1.0 + 2.0*q; 
 	uv.x*=iResolution.x/iResolution.y; 
     
    pixel_size = 1.0/(iResolution.x * 3.0);
	// camera
 	stime=0.7+0.3*sin(iTime*0.4); 
 	ctime=0.7+0.3*cos(iTime*0.4); 

 	vec3 ta=vec3(0.0,0.0,0.0); 
	vec3 ro = vec3(0.0, 3.*stime*ctime, 3.*(1.-stime*ctime));

 	vec3 cf = normalize(ta-ro); 
    vec3 cs = normalize(cross(cf,vec3(0.0,1.0,0.0))); 
    vec3 cu = normalize(cross(cs,cf)); 
 	vec3 rd = normalize(uv.x*cs + uv.y*cu + 3.0*cf);  // transform from view to world

    vec3 sundir = normalize(vec3(0.1, 0.8, 0.6)); 
    vec3 sun = vec3(1.64, 1.27, 0.99); 
    vec3 skycolor = vec3(0.6, 1.5, 1.0); 

	vec3 bg = exp(uv.y-2.0)*vec3(0.4, 1.6, 1.0);

    float halo=clamp(dot(normalize(vec3(-ro.x, -ro.y, -ro.z)), rd), 0.0, 1.0); 
    vec3 col=bg+vec3(1.0,0.8,0.4)*pow(halo,17.0); 


    float t=0.0;
    vec3 p=ro; 
	 
	vec3 res = intersect(ro, rd);
	 if(res.x > 0.0){
		   p = ro + res.x * rd;
           vec3 n=nor(p); 
           float shadow = softshadow(p, sundir, 10.0 );

           float dif = max(0.0, dot(n, sundir)); 
           float sky = 0.6 + 0.4 * max(0.0, dot(n, vec3(0.0, 1.0, 0.0))); 
 		   float bac = max(0.3 + 0.7 * dot(vec3(-sundir.x, -1.0, -sundir.z), n), 0.0); 
           float spe = max(0.0, pow(clamp(dot(sundir, reflect(rd, n)), 0.0, 1.0), 10.0)); 

           vec3 lin = 4.5 * sun * dif * shadow; 
           lin += 0.8 * bac * sun; 
           lin += 0.6 * sky * skycolor*shadow; 
           lin += 3.0 * spe * shadow; 

		   res.y = pow(clamp(res.y, 0.0, 1.0), 0.55);
		   vec3 tc0 = 0.5 + 0.5 * sin(3.0 + 4.2 * res.y + vec3(0.0, 0.5, 1.0));
           col = lin *vec3(0.9, 0.8, 0.6) *  0.2 * tc0;
 		   col=mix(col,bg, 1.0-exp(-0.001*res.x*res.x)); 
    } 

    // post
    col=pow(clamp(col,0.0,1.0),vec3(0.45)); 
    col=col*0.6+0.4*col*col*(3.0-2.0*col);  // contrast
    col=mix(col, vec3(dot(col, vec3(0.33))), -0.5);  // satuation
    col*=0.5+0.5*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),0.7);  // vigneting
 	fragColor = vec4(col.xyz, smoothstep(0.55, .76, 1.-res.x/5.)); 
 }

/** SHADERDATA
{
"title": "mandelbulb",
"author": "evilryu",
"description": "a mandelbulb",
"href": "https://www.shadertoy.com/view/MdXSWn"
}
*/
`

const sinusoidalTresJS = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float r = sin(iTime + uv.x + sin(uv.y + iTime));
    float g = pow(1.0 - sqrt(abs(cos(uv.y + uv.x + iTime))), sin(iTime) + 2.0);
    float b = pow(1.0 - sin(uv.y + iTime), cos(iTime) + 2.0 );
    float a = 
    0.5 * (sin(3.1 * uv.y + cos(uv.x * 2.7 + iTime) + iTime) * 0.5 + 0.5)
    + 0.15 * (0.5 * cos(3.14 * length(uv - vec2(0.5, 0.5)) + iTime) + 0.5)
    + 0.35 * (r + g + b) * 0.3333;

    fragColor = vec4(r, g, b, a);
}

/** SHADERDATA
{
	"title": "Sinusoidal for TresJS",
    "author": "andretchen0",
	"description": "Simple shader made for this TresJS lab",
    "href": "https://lab.tresjs.org"
}
*/
`

const sinusoidalTresJS2 = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    float g = pow(1.0 - sqrt(abs(cos(uv.y + uv.x + iTime * 0.1))), sin(iTime) + 2.0);
    float b = pow(1.0 - sin(uv.y + iTime), cos(iTime) + 2.0 );
    float r = sin(iTime + uv.y + sin(uv.y + iTime));

    fragColor = vec4(r, g, b, 0.);
}

/** SHADERDATA
{
	"title": "Sinusoidal 2 for TresJS",
    "author": "andretchen0",
	"description": "Simple shader made for this TresJS lab",
    "href": "https://lab.tresjs.org"
}
*/
`

const octgrams = `
// Source: https://www.shadertoy.com/view/tlVGDt
precision highp float;


float gTime = 0.;
const float REPEAT = 5.0;

mat2 rot(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c,s,-s,c);
}

float sdBox( vec3 p, vec3 b )
{
	vec3 q = abs(p) - b;
	return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float box(vec3 pos, float scale) {
	pos *= scale;
	float base = sdBox(pos, vec3(.4,.4,.1)) /1.5;
	pos.xy *= 5.;
	pos.y -= 3.5;
	pos.xy *= rot(.75);
	float result = -base;
	return result;
}

float box_set(vec3 pos, float iTime) {
	vec3 pos_origin = pos;
	pos = pos_origin;
	pos .y += sin(gTime * 0.4) * 2.5;
	pos.xy *=   rot(.8);
	float box1 = box(pos,2. - abs(sin(gTime * 0.4)) * 1.5);
	pos = pos_origin;
	pos .y -=sin(gTime * 0.4) * 2.5;
	pos.xy *=   rot(.8);
	float box2 = box(pos,2. - abs(sin(gTime * 0.4)) * 1.5);
	pos = pos_origin;
	pos .x +=sin(gTime * 0.4) * 2.5;
	pos.xy *=   rot(.8);
	float box3 = box(pos,2. - abs(sin(gTime * 0.4)) * 1.5);	
	pos = pos_origin;
	pos .x -=sin(gTime * 0.4) * 2.5;
	pos.xy *=   rot(.8);
	float box4 = box(pos,2. - abs(sin(gTime * 0.4)) * 1.5);	
	pos = pos_origin;
	pos.xy *=   rot(.8);
	float box5 = box(pos,.5) * 6.;	
	pos = pos_origin;
	float box6 = box(pos,.5) * 6.;	
	float result = max(max(max(max(max(box1,box2),box3),box4),box5),box6);
	return result;
}

float map(vec3 pos, float iTime) {
	vec3 pos_origin = pos;
	float box_set1 = box_set(pos, iTime);

	return box_set1;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
	vec2 p = (fragCoord.xy * 2. - iResolution.xy) / min(iResolution.x, iResolution.y);
	vec3 ro = vec3(0., -0.2 ,iTime * 4.);
	vec3 ray = normalize(vec3(p, 1.5));
	ray.xy = ray.xy * rot(sin(iTime * .03) * 5.);
	ray.yz = ray.yz * rot(sin(iTime * .05) * .2);
	float t = 0.1;
	vec3 col = vec3(0.);
	float ac = 0.0;


	for (int i = 0; i < 99; i++){
		vec3 pos = ro + ray * t;
		pos = mod(pos-2., 4.) -2.;
		gTime = iTime -float(i) * 0.01;
		
		float d = map(pos, iTime);

		d = max(abs(d), 0.01);
		ac += exp(-d*23.);

		t += d* 0.55;
	}

	col = vec3(ac * 0.02);

	col +=vec3(0.,0.2 * abs(sin(iTime)),0.5 + sin(iTime) * 0.2);


	fragColor = vec4(col ,1.0 - t * (0.02 + 0.02 * sin (iTime)));
}

/** SHADERDATA
{
	"title": "Octgrams",
    "author": "whisky_shusuky",
	"description": "Inspired by arabesque.",
    "href": "https://www.shadertoy.com/view/tlVGDt",
	"model": "person"
}
*/
`

const petersenPlasmaGraph = `
// PetersenPlasmaGraph.glsl - Dynamic visualization of PetersenGraph
// Combines Petersen Graph topology with Plasma visualization effects

// Angles for node positioning (in radians)
const float ANGLES[20] = float[20](
    // Middle circle (chainId 0-4) - Evenly distributed on the circle
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    // Inner circle (chainId 5-9) - Corresponding to middle circle angles
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    // Outer circle (chainId 10-19)
    4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444);

const float INNER_RADIUS = 0.15;
const float MIDDLE_RADIUS = 0.3;
const float OUTER_RADIUS = 0.48;

// Connection lookup table (from, to)
const ivec2 CONNECTIONS[30] = ivec2[30](
    // Middle to inner (+5 pattern)
    ivec2(0, 5), ivec2(1, 6), ivec2(2, 7), ivec2(3, 8), ivec2(4, 9),
    // Middle to outer (+10 pattern)
    ivec2(0, 10), ivec2(1, 11), ivec2(2, 12), ivec2(3, 13), ivec2(4, 14),
    // Middle to outer (+15 pattern)
    ivec2(0, 15), ivec2(1, 16), ivec2(2, 17), ivec2(3, 18), ivec2(4, 19),
    // Inner circle connections
    ivec2(5, 7), ivec2(6, 8), ivec2(7, 9), ivec2(8, 5), ivec2(9, 6),
    // Outer circle connections
    ivec2(10, 11), ivec2(11, 12), ivec2(12, 13), ivec2(13, 14), ivec2(14, 15), ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(19, 10));

// Connection types for coloring
const int CONN_TYPE[30] = int[30](
    // Connection types by group
    0, 0, 0, 0, 0,  // Middle to inner
    1, 1, 1, 1, 1,  // Middle to outer (+10)
    2, 2, 2, 2, 2,  // Middle to outer (+15)
    3, 3, 3, 3, 3,  // Inner circle
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4  // Outer circle
    );

// Get node position based on chainId
vec2 getNodePosition(int chainId) {
    float angle = ANGLES[chainId];
    float radius;

    if(chainId < 5)
        radius = MIDDLE_RADIUS;
    else if(chainId < 10)
        radius = INNER_RADIUS;
    else
        radius = OUTER_RADIUS;

    return vec2(radius * cos(angle), radius * sin(angle));
}

// Hash function from PlasmaGlobe
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

// Simplified noise function using basic smooth interpolation
float noise(in vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f); // Smooth interpolation
    float n = p.x + p.y * 57.0;
    float res = mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
    return res;
}

// Matrix for rotations
mat2 mm2(in float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

// Flow effect function
float flow(in vec2 p, in float t) {
    float z = 2.0;
    float rz = 0.0;
    vec2 bp = p;

    for(float i = 1.0; i < 3.0; i++) {
        p += iTime * 0.1;
        float n = noise(p * 4.0 + t * 0.8); // Lower frequency
        rz += (sin(n * 6.0) * 0.5 + 0.5) / z;
        p = mix(bp, p, 0.6);
        z *= 2.0;
        p *= 2.01;
        p = p * mm2(iTime * 0.04 * i);
    }
    return rz;
}

// Draw a node with plasma effect
vec4 drawNode(vec2 uv, vec2 pos, int chainId) {
    float dist = length(uv - pos);
    float nodeSize = 0.025;

    // Node base color
    vec3 nodeBaseColor;
    if(chainId < 5)
        nodeBaseColor = vec3(1.0, 0.0, 0.0);  // Red
    else if(chainId < 10)
        nodeBaseColor = vec3(0.0, 0.0, 1.0);  // Blue
    else
        nodeBaseColor = vec3(1.0, 1.0, 0.0);   // Yellow

    // Flow effect calculation
    float flowEffect = flow(uv * 15.0, iTime * 0.2 + float(chainId));
    float glowSize = nodeSize * (1.8 + 0.4 * sin(iTime * 2.0 + float(chainId)));

    // Core and glow effect
    float core = smoothstep(nodeSize, nodeSize * 0.4, dist);
    float glow = smoothstep(glowSize, nodeSize, dist) * 0.8 * flowEffect;

    vec3 nodeColor = mix(nodeBaseColor, vec3(1.0), 0.3 + 0.3 * flowEffect);
    float alpha = max(core, glow * 0.8);
    vec3 finalColor = nodeColor * (core + glow * 1.2);

    return vec4(finalColor, alpha);
}

vec4 drawPlasmaConnection(vec2 uv, vec2 p1, vec2 p2, int connType, float seed) {
    // Direction vector and distance to the point
    vec2 dir = p2 - p1;
    float len = length(dir);
    dir = normalize(dir);
    vec2 normal = vec2(-dir.y, dir.x);

    // Project uv onto the line segment
    vec2 uv_rel = uv - p1;
    float alongLine = dot(uv_rel, dir);
    float perpLine = dot(uv_rel, normal);

    // Return if outside the line segment range
    if(alongLine < -0.01 || alongLine > len + 0.01)
        return vec4(0.0);

    // Normalize along-line position (0-1)
    float normAlong = clamp(alongLine / len, 0.0, 1.0);
    float time = iTime * 1.1;

    // Simplified color selection
    vec3 baseColor;
    switch(connType) {
        case 0:
            baseColor = vec3(1.0, 0.4, 0.3);
            break;  // Red - Middle to inner circle
        case 1:
            baseColor = vec3(0.9, 0.7, 0.3);
            break;  // Gold - Middle to outer circle (+10)
        case 2:
            baseColor = vec3(0.22, 0.59, 0.96);
            break; // Blue - Middle to outer circle (+15)
        case 3:
            baseColor = vec3(0.3, 0.9, 1.0);
            break;  // Cyan - Inner circle connections
        case 4:
            baseColor = vec3(1.0, 1.0, 0.21);
            break; // Yellow - Outer circle connections
        default:
            baseColor = vec3(0.7, 0.7, 0.7);        // Gray
    }

    // Base arc width remains constant
    float arcWidth = 0.0025 * (0.8 + 0.2 * len / 0.5);

    float distortionAmount;

    // Determine connection ring type
    if(connType == 3) {
        // Inner circle connections - Minimum distortion
        distortionAmount = 0.008;
    } else if(connType == 0) {
        // Middle to inner circle - Small distortion
        distortionAmount = 0.015;
    } else if(connType == 1 || connType == 2) {
        // Middle to outer circle - Moderate distortion
        distortionAmount = 0.02;
    } else if(connType == 4) {
        // Outer circle connections - Maximum distortion
        distortionAmount = 0.025;
    } else {
        // Default
        distortionAmount = 0.02;
    }

    float lowFreq = 5.0;
    float highFreq = 20.0;

    // Use only two noise layers, but adjust frequency based on connection type
    float noise1 = noise(vec2(normAlong * lowFreq + time * 0.5, seed * 10.0)) * 2.0 - 1.0;  // Low frequency
    float noise2 = noise(vec2(normAlong * highFreq - time * 0.7, seed * 5.0)) * 2.0 - 1.0;  // High frequency

    // Combine noise layers - Simplified to two layers
    float combinedNoise = noise1 * 0.7 + noise2 * 0.3;

    // Calculate distorted distance
    float distortedDist = abs(perpLine - distortionAmount * combinedNoise);

    // Main arc path, fixed thickness
    float thickness = arcWidth * (0.6 + 0.4 * noise(vec2(normAlong * 5.0, time * 0.3 + seed * 10.0)));

    // Main arc rendering
    float mainArc = smoothstep(thickness, thickness * 0.3, distortedDist);

    // Glow effect
    float glow = 0.2 / (1.0 + 15.0 * distortedDist * distortedDist);

    // Color variation
    vec3 arcColor = baseColor + 0.2 * sin(vec3(3.0, 1.0, 2.0) * (time * 0.5 + normAlong * 3.0));

    // Flicker effect - Adjust flicker speed and amplitude
    float flickerSpeed = 3.0;

    float flickerAmount;
    if(connType == 3) {
        // Inner circle - Slower flicker, smaller amplitude
        flickerAmount = 0.2;
    } else if(connType == 0) {
        // Middle to inner circle
        flickerAmount = 0.25;
    } else if(connType == 1 || connType == 2) {
        // Middle to outer circle
        flickerAmount = 0.3;
    } else {
        // Outer circle - Faster flicker, larger amplitude
        flickerAmount = 0.35;
    }

    float flicker = (1.0 - flickerAmount) + flickerAmount * sin(time * (flickerSpeed + seed * 3.0) + normAlong * 4.0);
    float arcIntensity = mainArc * flicker * 1.2 + glow * 0.9;

    vec3 finalColor = arcColor * arcIntensity;

    // Spark effect
    float sparkThreshold = 0.9;

    if(noise(vec2(time * 5.0 + seed * 15.0, normAlong * 10.0)) > sparkThreshold) {
        // Outer circle sparks are larger and brighter
        float sparkSize = (connType == 4) ? 25.0 : 20.0;
        float sparkDist = length(vec2(normAlong - noise(vec2(time * 1.5, seed)) * 0.08, perpLine) * sparkSize);
        float sparkBrightness = (connType == 4) ? 1.2 : 0.7;
        float spark = sparkBrightness / (1.0 + sparkDist * sparkDist);
        finalColor += arcColor * spark;
    }

    // Alpha value
    float alpha = min(arcIntensity * 0.8, 1.0);

    return vec4(finalColor, alpha);
}

// Circle drawing function
vec4 drawCircle(vec2 uv, float radius, vec3 color, float time) {
    // Distance to the center
    float dist = length(uv);

    // Fixed circle width
    float thickness = 0.003;

    // Simple circle
    float ring = smoothstep(radius + thickness, radius, dist) *
        smoothstep(radius - thickness, radius, dist);

    // Return color
    return vec4(color * ring, ring * 0.8);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // Background color
    vec4 backgroundColor = vec4(0.02, 0.02, 0.05, 1.0);

    // Coordinate system
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);

    // Scaling
    float globalScale = 0.7;
    uv = uv / globalScale;

    // Rotation
    float rotation = iTime * 0.1;
    mat2 rotMat = mm2(rotation);
    vec2 rotatedUv = uv * rotMat;

    // Initialize color
    fragColor = backgroundColor;

    // 1. Draw concentric circles
    vec3 innerCircleColor = vec3(0.3, 0.8, 1.0) * 0.5;  // Inner circle color - Blue
    vec3 middleCircleColor = vec3(1.0, 0.5, 0.3) * 0.5; // Middle circle color - Red
    vec3 outerCircleColor = vec3(1.0, 1.0, 0.4) * 0.5;  // Outer circle color - Yellow

    vec4 innerCircle = drawCircle(rotatedUv, INNER_RADIUS, innerCircleColor, iTime);
    vec4 middleCircle = drawCircle(rotatedUv, MIDDLE_RADIUS, middleCircleColor, iTime * 0.8);
    vec4 outerCircle = drawCircle(rotatedUv, OUTER_RADIUS, outerCircleColor, iTime * 0.6);

    // Blend circles
    fragColor.rgb = mix(fragColor.rgb, innerCircle.rgb, innerCircle.a);
    fragColor.rgb = mix(fragColor.rgb, middleCircle.rgb, middleCircle.a);
    fragColor.rgb = mix(fragColor.rgb, outerCircle.rgb, outerCircle.a);

    // 2. Draw arcs
    for(int i = 0; i < 30; i++) {
        int fromId = CONNECTIONS[i].x;
        int toId = CONNECTIONS[i].y;
        int connType = CONN_TYPE[i];

        vec2 fromPos = getNodePosition(fromId) * rotMat;
        vec2 toPos = getNodePosition(toId) * rotMat;

        float seed = float(i) * 0.1;

        vec4 arcColor = drawPlasmaConnection(uv, fromPos, toPos, connType, seed);
        fragColor.rgb = mix(fragColor.rgb, arcColor.rgb, arcColor.a * 0.7);
    }

    // 3. Draw nodes
    for(int i = 0; i < 20; i++) {
        vec2 pos = getNodePosition(i) * rotMat;
        vec4 nodeColor = drawNode(uv, pos, i);
        fragColor.rgb = mix(fragColor.rgb, nodeColor.rgb, nodeColor.a * 0.9);
    }

    // Add vignette effect
    float vignette = 1.0 - smoothstep(0.5, 1.8, length(fragCoord / iResolution.xy - 0.5) * 1.1);
    fragColor.rgb *= vignette * 1.2;

    // Remove redundant background plasma effect

    // Ensure alpha is 1.0
    fragColor.a = 1.0;
}

/** SHADERDATA
{
    "title": "Petersen Plasma Graph",
    "author": "Vootaa Labs",
    "description": "Mathematical graph theory visualization with Chainweb inspiration",
    "href": "https://github.com/vootaa/3DVL"
}
*/
`

const petersenGraphTresJS = `
// Petersen Graph - Optimized for museum display with fine details

// Node positions (in radians)
const float ANGLES[20] = float[20](
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    5.0265, 0.0, 1.2566, 2.5133, 3.7699,
    4.8521, 0.1745, 1.0821, 2.6878, 3.5954, 5.2009, 6.1087, 1.4312, 2.3387, 3.9444
);

const float INNER_RADIUS = 0.15;
const float MIDDLE_RADIUS = 0.3;
const float OUTER_RADIUS = 0.48;

// Connections
const ivec2 CONNECTIONS[30] = ivec2[30](
    ivec2(0, 5), ivec2(1, 6), ivec2(2, 7), ivec2(3, 8), ivec2(4, 9),
    ivec2(0, 10), ivec2(1, 11), ivec2(2, 12), ivec2(3, 13), ivec2(4, 14),
    ivec2(0, 15), ivec2(1, 16), ivec2(2, 17), ivec2(3, 18), ivec2(4, 19),
    ivec2(5, 7), ivec2(6, 8), ivec2(7, 9), ivec2(8, 5), ivec2(9, 6),
    ivec2(10, 11), ivec2(11, 12), ivec2(12, 13), ivec2(13, 14), ivec2(14, 15), 
    ivec2(15, 16), ivec2(16, 17), ivec2(17, 18), ivec2(18, 19), ivec2(19, 10)
);

// Get node position
vec2 getNodePosition(int chainId) {
    float angle = ANGLES[chainId];
    float radius = chainId < 5 ? MIDDLE_RADIUS : (chainId < 10 ? INNER_RADIUS : OUTER_RADIUS);
    return vec2(radius * cos(angle), radius * sin(angle));
}

// Smooth line drawing with anti-aliasing
float drawLine(vec2 uv, vec2 p1, vec2 p2, float thickness) {
    vec2 dir = p2 - p1;
    float len = length(dir);
    if (len < 0.001) return 0.0;
    dir /= len;
    
    vec2 perpDir = vec2(-dir.y, dir.x);
    float h = clamp(dot(uv - p1, dir), 0.0, len);
    float d = abs(dot(uv - p1, perpDir));
    
    // Smooth anti-aliased line
    return 1.0 - smoothstep(thickness * 0.5, thickness, d);
}

// Smooth circle with anti-aliasing
float drawCircle(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    return 1.0 - smoothstep(radius * 0.8, radius, d);
}

// Smooth ring with anti-aliasing
float drawRing(vec2 uv, float radius, float thickness) {
    float dist = length(uv);
    float inner = radius - thickness * 0.5;
    float outer = radius + thickness * 0.5;
    return smoothstep(inner - 0.001, inner, dist) * (1.0 - smoothstep(outer, outer + 0.001, dist));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // High-precision coordinate normalization
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
    
    // Fine-tuned scale for museum display
    uv *= 0.9;
    
    // Slow rotation for better viewing
    float time = iTime * 0.08;
    mat2 rot = mat2(cos(time), sin(time), -sin(time), cos(time));
    uv = rot * uv;
    
    // Initialize with background
    vec3 color = vec3(0.0);
    float alpha = 0.0;
    
    // Draw rings with fine details
    float innerRing = drawRing(uv, INNER_RADIUS, 0.004);
    float middleRing = drawRing(uv, MIDDLE_RADIUS, 0.004);
    float outerRing = drawRing(uv, OUTER_RADIUS, 0.004);
    
    // High-contrast ring colors
    color += vec3(0.3, 0.7, 1.0) * innerRing * 2.0;   // Bright blue
    color += vec3(1.0, 0.4, 0.6) * middleRing * 2.0;  // Bright pink
    color += vec3(1.0, 0.9, 0.3) * outerRing * 2.0;   // Bright gold
    alpha += innerRing + middleRing + outerRing;
    
    // Draw connections with fine lines
    for(int i = 0; i < 30; i++) {
        vec2 p1 = getNodePosition(CONNECTIONS[i].x);
        vec2 p2 = getNodePosition(CONNECTIONS[i].y);
        
        float line = drawLine(uv, p1, p2, 0.002);  // Thin but visible lines
        
        // Distinct colors for different connection types
        vec3 lineColor;
        if (i < 5) {
            lineColor = vec3(0.9, 0.5, 1.0) * 1.8;     // Bright purple
        } else if (i < 15) {
            lineColor = vec3(1.0, 0.7, 0.4) * 1.8;     // Bright orange
        } else if (i < 20) {
            lineColor = vec3(0.5, 0.9, 1.0) * 1.8;     // Bright cyan
        } else {
            lineColor = vec3(1.0, 0.9, 0.5) * 1.8;     // Bright yellow
        }
        
        color += lineColor * line;
        alpha += line * 0.5;
    }
    
    // Draw nodes with proper sizing
    for(int i = 0; i < 20; i++) {
        vec2 pos = getNodePosition(i);
        float radius = i < 5 ? 0.012 : (i < 10 ? 0.010 : 0.008);  // Progressive sizing
        float node = drawCircle(uv, pos, radius);
        
        // Bright, distinct node colors
        vec3 nodeColor;
        if (i < 5) {
            nodeColor = vec3(1.0, 0.6, 0.8) * 3.0;   // Bright pink
        } else if (i < 10) {
            nodeColor = vec3(0.6, 0.9, 1.0) * 3.0;   // Bright cyan
        } else {
            nodeColor = vec3(1.0, 1.0, 0.6) * 3.0;   // Bright yellow
        }
        
        color += nodeColor * node;
        alpha += node;
    }
    
    // Enhanced brightness and contrast for museum display
    color = clamp(color * 1.2, 0.0, 3.0);
    
    // Clean output
    fragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}

/** SHADERDATA
{
    "title": "Petersen Graph Network",
    "author": "Vootaa Labs",
    "description": "Mathematical graph theory visualization with enhanced museum display optimization",
    "href": "https://github.com/vootaa/3DVL"
}
*/
`

export const mainImage = gamesOfSinus

export const shaderToySrc = {
    gamesOfSinus,
    mandelbulb,
    sinusoidalTresJS,
    sinusoidalTresJS2,
    octgrams,
    petersenPlasmaGraph,
    petersenGraphTresJS,
}