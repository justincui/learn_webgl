<html>

<!--
////////////////COPYRIGHT DECLARATION//////////////////////
//////
////// COPYRIGHT GUANYU HE AND HAO WU, 2013
////// ALL THE FOLLOWING CODE IS PROTECTED BY THE COPYRIGHT
//////
////// THE CODE IN THIS FILE CANNOT BE REUSED OUTSIDE CIS565 GPU PROGRAMMING COURSE
////// IN UNIVERSITY OF PENNSYLVANIA UNLESS SPECIAL AUTHORIZATION.
//////
////// CONTACT INFO: heguanyu9037@gmail.com
//////                  wuhao1117@gmail.com
//////
////////////////FILE INFO ///////////////////////////////
//////
//////  INCLUDING
//////   -HTML FORMATIONS, CANVAS
//////   -VERT SHADER FOR THE QUAD
//////   -FRAG SHADER FOR SIMULATION
//////   -FARG SHADER FOR PING-PONG EXCHANGE
//////   -VERT SHADER FOR THE FULL-RESOLUTION OCEAN PATCH
//////   -FRAG SHADER FOR THE FULL-RESOLUTION OCEAN PATCH
//////   -VERT SHADER FOR THE LOW-RESOLUTION OCEAN PATCH
//////   -FRAG SHADER FOR THE LOW-RESOLUTION OCEAN PATCH
//////   -FRAG SHADER FOR THE SKY RENDERING
//////   -PARAMETER SET CONTROL PANEL
//////
////////////////////////////////////////////////////////////
-->
<script src ="libs/gl-matrix.js" type ="text/javascript"></script>
<script src="libs/webgl-utils.js" type="text/javascript"></script>
<script src="libs/stats.min.js" type="text/javascript"></script>

<link rel="stylesheet" href="libs/jquery-ui-1.10.3.custom.css" >
    <script src="libs/jquery-1.9.1.js" type="text/javascript"></script>
    <script src="libs/jquery-ui-1.10.3.custom.js" type="text/javascript"></script>


    <script src="fft.js" type="text/javascript"></script>
    <script src="wave.js" type="text/javascript"></script>
    <script src="skyshader.js" type="text/javascript"></script>

    <head>
        <title>Water Shader</title>
        <meta charset ="utf-8">
            <meta http-equiv="X-UA-Compatible" content="chrome=1">  <!-- Use Chrome Frame in IE -->

                <script id="vs_quad" type="x-shader/x-vertex">
                    precision highp float;

                    attribute vec2 position;

                    varying vec2 f_Pos;

                    void main(void)
                    {
                        f_Pos = position;
                        gl_Position= vec4(position, 0.0, 1.0);
                    }
                </script>
                <script id="fs_simFFT" type="x-shader/x-fragment">
                    precision highp float;

                    vec2 conjugate(vec2 arg)
                    {
                        return vec2(arg.x, -arg.y);
                    }


                    vec2 complex_exp(float arg)
                    {
                        return vec2(cos(arg), sin(arg));
                    }


                    vec2 complex_add(vec2 a, vec2 b)
                    {
                        return vec2(a.x + b.x, a.y + b.y);
                    }


                    vec2 complex_mult(vec2 a, vec2 b)
                    {
                        return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
                    }

                    uniform float u_meshSize;
                    uniform float u_patchSize;
                    uniform sampler2D u_simData;
                    uniform float u_time;

                    varying vec2 f_Pos;

                    const float PI = 3.14159265359;

                    void main(void)
                    {
                        float delta = 1.0 / u_meshSize;
                        // map to [0, 1] range, not perfectly aligned with texel centers???
                        vec2 texcoord = (f_Pos + vec2(1.0)) * 0.5; // now center of any fragment is from vec2(-1.0 + delta/2.0) to vec2(1.0 - delta/2.0)
                        vec2 texcoordMirrored = vec2(1.0) - texcoord;

                        // map texcoord to [0, meshSize) range;
                        vec2 n = (texcoord - vec2(delta/2.0)) * u_meshSize;
                        // wave vector
                        vec2 k = (-u_meshSize*0.5 + n) * (2.0 * PI / u_patchSize);

                        // calculate dispersion w(k)
                        float w = sqrt(9.81 * length(k));

                        vec2 h0_k = texture2D(u_simData, texcoord).xy;
                        vec2 h0_mk = texture2D(u_simData, texcoordMirrored).xy;

                        // output frequency-space complex values
                        vec2 ht = complex_add(complex_mult(h0_k, complex_exp(w * u_time)), complex_mult(conjugate(h0_mk), complex_exp(-w * u_time)));

                        // swap real and imaginary part for inverse FFT input
                        gl_FragColor = vec4(ht.xy, 0.0, 1.0);
                    }
                </script>
                <script id="fs_fftHorizontal" type="x-shader/x-fragment">
                    precision highp float;

                    vec2 complex_add(vec2 a, vec2 b)
                    {
                        return vec2(a.x + b.x, a.y + b.y);
                    }


                    vec2 complex_mult(vec2 a, vec2 b)
                    {
                        return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
                    }

                    varying vec2 f_Pos;

                    uniform sampler2D u_fftData;
                    uniform sampler2D u_butterflyData;

                    void main(void)
                    {
                        vec2 texcoord = (f_Pos+vec2(1.0))*0.5;
                        vec4 indicesAndWeight = texture2D(u_butterflyData, texcoord);

                        float sourceTexCoord1 = indicesAndWeight.r;
                        float sourceTexcoord2 = indicesAndWeight.g;
                        vec2 weight = indicesAndWeight.ba;

                        vec2 source1 = texture2D(u_fftData, vec2(sourceTexCoord1, texcoord.y)).xy;
                        vec2 source2 = texture2D(u_fftData, vec2(sourceTexcoord2, texcoord.y)).xy;

                        vec2 result = complex_add(source1, complex_mult(source2, weight));

                        gl_FragColor = vec4(result, 0.0, 1.0);
                    }
                </script>
                <script id="fs_fftVertical" type="x-shader/x-fragment">
                    precision highp float;

                    vec2 complex_add(vec2 a, vec2 b)
                    {
                        return vec2(a.x + b.x, a.y + b.y);
                    }


                    vec2 complex_mult(vec2 a, vec2 b)
                    {
                        return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
                    }

                    varying vec2 f_Pos;

                    uniform sampler2D u_fftData;
                    uniform sampler2D u_butterflyData; // same data as the horizontal stage

                    void main(void)
                    {
                        vec2 texcoord = (f_Pos+vec2(1.0))*0.5;
                        vec4 indicesAndWeight = texture2D(u_butterflyData, texcoord.yx); // reverse xy order to reuse the indicesAndWeight texture

                        float sourceTexCoord1 = indicesAndWeight.r;
                        float sourceTexcoord2 = indicesAndWeight.g;
                        vec2 weight = indicesAndWeight.ba;

                        vec2 source1 = texture2D(u_fftData, vec2(texcoord.x, sourceTexCoord1)).xy;
                        vec2 source2 = texture2D(u_fftData, vec2(texcoord.x, sourceTexcoord2)).xy;

                        vec2 result = complex_add(source1, complex_mult(source2, weight));

                        gl_FragColor = vec4(result, 0.0, 1.0);
                        //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    }
                </script>
                <script id="vs_render" type="x-shader/x-vertex">
                    precision highp float;

                    attribute vec3 position;
                    attribute vec3 normal;
                    attribute vec2 texCoord;
                    attribute vec3 offset;

                    uniform mat4 u_model;
                    uniform mat4 u_view;
                    uniform mat4 u_persp;
                    uniform mat4 u_modelView;
                    uniform mat4 u_modelViewPerspective;
                    uniform mat4 u_normalMatrix;

                    uniform float u_meshSize;
                    uniform sampler2D u_simData;
                    uniform float u_time;
                    uniform float u_patchSize;


                    varying vec3 position_world;          //position on the model
                    varying vec3 normal_world;            //texture coordination



                    float signCorrection(vec2 texCoord,float delta)
                    {
                        vec2 texCoord1 = vec2(floor((texCoord - vec2(delta*0.5)) * 512.0 + 0.5));
                        float signCorrection = abs(texCoord1.x + texCoord1.y - 2.0 * floor((texCoord1.x + texCoord1.y) / 2.0 + 1e-6)) < 0.1 ? -1.0 : 1.0;
                        return signCorrection;
                    }

                    vec3 repeatCoord(vec2 coord)
                    {
                        vec3 result = vec3(coord,0.0);
                        if(result.x>1.0) {result.x-=1.0; result.z=1.0;}
                        if(result.x<0.0) {result.x+=1.0;result.z=1.0;}
                        if(result.y>1.0) {result.y-=1.0;result.z=1.0;}
                        if(result.y<0.0) {result.y+=1.0;result.z=1.0;}
                        return result;
                    }

                    float getHeight(vec2 coord, float delta)
                    {
                        return signCorrection(coord,delta) * texture2D(u_simData, coord).r;
                    }
                    void main(void)
                    {
                        float delta = 1.0/u_meshSize;
                        float patchsize = u_patchSize;

                        vec2 mytexcoord = texCoord;

                        vec2 upcoord    = mytexcoord + vec2(0.0, delta);
                        vec2 downcoord  = mytexcoord - vec2(0.0, delta);
                        vec2 leftcoord  = mytexcoord - vec2(delta, 0.0);
                        vec2 rightcoord = mytexcoord + vec2(delta, 0.0);

                        vec3 upcoord_repeat = repeatCoord(upcoord);
                        vec3 downcoord_repeat = repeatCoord(downcoord);
                        vec3 leftcoord_repeat = repeatCoord(leftcoord);
                        vec3 rightcoord_repeat = repeatCoord(rightcoord);


                        upcoord = upcoord_repeat.xy;
                        downcoord =downcoord_repeat.xy;
                        leftcoord = leftcoord_repeat.xy;
                        rightcoord = rightcoord_repeat.xy;

                        vec3 gridPosition = position;
                        vec3 positionModel = vec3(gridPosition.x, 0.0, gridPosition.z);
                        float height = getHeight(mytexcoord,delta);

                        positionModel.y=height;
                        position_world = (u_model*vec4(positionModel,1.0)).xyz;

                        vec3 upPositionModel =    vec3(gridPosition.x,                 0.0,    gridPosition.z+delta*patchsize);
                        vec3 downPositionModel =  vec3(gridPosition.x,                 0.0,  gridPosition.z-delta*patchsize);
                        vec3 leftPositionModel =  vec3(gridPosition.x-delta*patchsize, 0.0,  gridPosition.z);
                        vec3 rightPositionModel = vec3(gridPosition.x+delta*patchsize, 0.0, gridPosition.z);

                        float heightup = getHeight(upcoord,delta);
                        float heightdown = getHeight(downcoord,delta);
                        float heightleft = getHeight(leftcoord,delta);
                        float heightright = getHeight(rightcoord,delta);

                        upPositionModel.y=heightup;
                        downPositionModel.y = heightdown;
                        leftPositionModel.y =  heightleft;
                        rightPositionModel.y = heightright;

                        vec3 upPositionWorld =(u_model*vec4(upPositionModel,1.0)).xyz;
                        vec3 downPositionWorld =(u_model*vec4(downPositionModel,1.0)).xyz;
                        vec3 leftPositionWorld =(u_model*vec4(leftPositionModel,1.0)).xyz;
                        vec3 rightPositionWorld =(u_model*vec4(rightPositionModel,1.0)).xyz;



                        vec3 totalNormal=vec3(0.0);
                        totalNormal+=normalize(cross(position_world-leftPositionWorld,upPositionWorld-position_world));
                        totalNormal+=normalize(cross(position_world-upPositionWorld,rightPositionWorld-position_world));
                        totalNormal+=normalize(cross(position_world-rightPositionWorld,downPositionWorld-position_world));
                        totalNormal+=normalize(cross(position_world-downPositionWorld,leftPositionWorld-position_world));

                        totalNormal=normalize(totalNormal);
                        normal_world = totalNormal;

                        float count = 1.0;

                        if(upcoord_repeat.z>0.9) {height+=heightup;count+=1.0;}
                        if(downcoord_repeat.z>0.9) {height+=heightdown;count+=1.0;}
                        if(leftcoord_repeat.z>0.9) {height+=heightleft;count+=1.0;}
                        if(rightcoord_repeat.z>0.9) {height+=heightright;count+=1.0;}

                        height = height/count;

                        gridPosition = vec3(position.x,height,position.z);

                        gl_Position = u_modelViewPerspective * vec4(gridPosition, 1.0);
                    }
                </script>
                <script id="fs_render" type="x-shader/x-fragment">
                    precision highp float;

                    uniform sampler2D u_simData;
                    uniform float u_time;
                    uniform vec3 u_oceancolor;
                    uniform vec4 sky_params1;
                    uniform vec4 sky_params2;
                    uniform vec4 sky_params3;
                    uniform vec4 sky_params4;
                    uniform vec4 sky_params5;
                    uniform vec4 sky_params6;
                    uniform mat4 u_model;
                    uniform mat4 u_view;
                    uniform mat4 u_persp;
                    uniform mat4 u_modelViewInverse;
                    uniform mat4 u_normal;
                    uniform mat4 u_modelViewPerspective;
                    uniform float u_meshSize;
                    uniform vec3 eyePos;
                    uniform vec3 u_sunPos;


                    varying vec3 position_world;
                    varying vec3 normal_world;



                    vec3 hdr (vec3 color, float exposure) {
                    return 1.0 - exp(-color * exposure);
                }

                    //////SKY CALCULATION
                    vec3 calcExtinction(float dist) {
                    return exp(dist * sky_params6.xyz);
                }
                    vec3 calcScattering(float cos_theta) {
                    float r_phase = (cos_theta * cos_theta) * sky_params6.w + sky_params6.w;
                    float m_phase = sky_params1.w * pow(sky_params2.w * cos_theta + sky_params3.w, -1.5);
                    return sky_params2.xyz * r_phase + (sky_params3.xyz * m_phase);
                }
                    float baseOpticalDepth(in vec3 ray) {
                    float a1 = sky_params4.x * ray.y;
                    return sqrt(a1 * a1 + sky_params4.w) - a1;
                }
                    float opticalDepth(in vec3 pos, in vec3 ray) {
                    pos.y += sky_params4.x;
                    float a0 = sky_params4.y - dot(pos, pos);
                    float a1 = dot(pos, ray);
                    return sqrt(a1 * a1 + a0) - a1;
                }
                    vec3 getSkyColor(vec3 view_vec)
                    {
                        vec3 sun_vector = normalize(u_sunPos);
                        float cos_theta = dot(view_vec, sun_vector);
                        float ray_dist = baseOpticalDepth(view_vec);

                        vec3 extinction = calcExtinction(ray_dist);
                        vec3 light_ray_pos = view_vec * (ray_dist * sky_params4.z);
                        float light_ray_dist = opticalDepth(light_ray_pos, sun_vector);
                        float light_ray_dist_full = opticalDepth(view_vec * ray_dist, sun_vector);
                        light_ray_dist = max(light_ray_dist, light_ray_dist_full);
                        vec3 incoming_light = calcExtinction(light_ray_dist);

                        vec3 scattering = calcScattering(cos_theta);
                        scattering *= 1.0 - extinction;

                        vec3 in_scatter = incoming_light * scattering;

                        float sun_strength = clamp(cos_theta * sky_params1.x + sky_params1.y, 0.0, 1.0);
                        sun_strength *= sun_strength;
                        vec3 sun_disk = extinction * sun_strength;
                        return sky_params5.xyz * (sky_params5.w * sun_disk + in_scatter);
                    }
                    ////////////END SKY CALCULATION

                    void main(void)
                    {

                        gl_FragColor.w = 1.0;

                        float delta = 1.0/u_meshSize;
                        vec3 outcolor=vec3(0.0);

                        vec3 sunpos = u_sunPos;
                        vec3 incidentdir = normalize(position_world-sunpos);


                        vec3 standardnormal = -normalize(normal_world);

                        vec3 reflectiondir = normalize(incidentdir-2.0*standardnormal*dot(incidentdir,standardnormal));

                        vec3 eyepos = eyePos;


                        vec3 eyeraydir = normalize(eyepos-position_world);          ///from point to eye
                        vec3 directionalLightDir = normalize(vec3(0.0,1.0,0.0));
                        float specular1 = pow(max(0.01,dot(eyeraydir,reflectiondir)),5000.0);


                        vec3 ocean_color = u_oceancolor;



                        vec3 sky_color = vec3(3.2, 9.6, 12.8)*0.8;


                        vec3 view = normalize(eyePos - position_world);

                        float incidentAngle=acos(abs(dot(standardnormal, view)));
                        float transmittanceAngle = asin(sin(incidentAngle)/1.33);      //1.33 is the water transmittance ratio
                        float temp1 = tan(incidentAngle-transmittanceAngle)/tan(incidentAngle+transmittanceAngle);
                        float temp2 = sin(incidentAngle-transmittanceAngle)/sin(incidentAngle+transmittanceAngle);

                        float fresnel =(temp1*temp1+temp2*temp2)*0.5;
                        //gl_FragColor.xyz = vec3(fresnel);
                        //return;

                        ///use negative eyeraydir for the direction from eye to point
                        /// and get the reflection direction
                        vec3 eyeReflDir = normalize(-eyeraydir-2.0*standardnormal*dot(-eyeraydir,standardnormal));
                        eyeReflDir.y=abs(eyeReflDir.y);
                        vec3 sun_color = getSkyColor(normalize(sunpos));
                        sky_color = getSkyColor(eyeReflDir)*10.0;


                        vec3 sky = fresnel * sky_color;


                        float specular2 = clamp(dot(standardnormal, directionalLightDir), 0.0, 1.0);
                        specular2 = pow(specular2,1.0);


                        vec3 water = (1.0 - fresnel) * ocean_color  * specular2*sky_color;

                        outcolor = 100.0*specular1*sun_color + sky + water;


                        gl_FragColor = vec4(hdr(outcolor,0.35), 1.0);
                        return;
                        float density = 6.0;
                        float z = gl_FragCoord.z/gl_FragCoord.w/1000.0;
                        float fog=z*density;
                        vec4 fogcolor= vec4(1.0,1.0,1.0,0.0);
                        gl_FragColor = mix(fogcolor, gl_FragColor, clamp(1.0-fog,0.0,1.0));
                    }
                </script>
                <script id="vs_render_lowres" type="x-shader/x-vertex">
                    precision highp float;

                    attribute vec3 position;
                    attribute vec3 normal;
                    attribute vec2 texCoord;
                    attribute vec3 offset;

                    uniform mat4 u_model;
                    uniform mat4 u_view;
                    uniform mat4 u_persp;
                    uniform mat4 u_modelView;
                    uniform mat4 u_modelViewPerspective;
                    uniform mat4 u_normalMatrix;

                    uniform float u_meshSize;
                    uniform sampler2D u_simData;
                    uniform float u_time;
                    uniform float u_patchSize;


                    varying vec3 position_world;          //position on the model
                    varying vec2 fTexcoord;
                    varying vec3 gridPosition;



                    float signCorrection(vec2 texCoord,float delta)
                    {
                        vec2 texCoord1 = vec2(floor((texCoord - vec2(delta*0.5)) * 512.0 + 0.5));
                        float signCorrection = abs(texCoord1.x + texCoord1.y - 2.0 * floor((texCoord1.x + texCoord1.y) / 2.0 + 1e-6)) < 0.1 ? -1.0 : 1.0;
                        return signCorrection;
                    }
                    float getHeight(vec2 coord, float delta)
                    {
                        return signCorrection(coord,delta) * texture2D(u_simData, coord).r;
                    }
                    vec3 repeatCoord(vec2 coord)
                    {
                        vec3 result = vec3(coord,0.0);
                        if(result.x>1.0) {result.x-=1.0; result.z=1.0;}
                        if(result.x<0.0) {result.x+=1.0;result.z=1.0;}
                        if(result.y>1.0) {result.y-=1.0;result.z=1.0;}
                        if(result.y<0.0) {result.y+=1.0;result.z=1.0;}
                        return result;
                    }

                    void main(void)
                    {
                        float delta = 1.0/u_meshSize;
                        float patchsize = u_patchSize;

                        vec2 mytexcoord = texCoord;
                        fTexcoord=texCoord;

                        vec2 upcoord    = mytexcoord + vec2(0.0, delta);
                        vec2 downcoord  = mytexcoord - vec2(0.0, delta);
                        vec2 leftcoord  = mytexcoord - vec2(delta, 0.0);
                        vec2 rightcoord = mytexcoord + vec2(delta, 0.0);

                        float height = getHeight(mytexcoord,delta);
                        gridPosition = position;

                        vec3 upcoord_repeat = repeatCoord(upcoord);
                        vec3 downcoord_repeat = repeatCoord(downcoord);
                        vec3 leftcoord_repeat = repeatCoord(leftcoord);
                        vec3 rightcoord_repeat = repeatCoord(rightcoord);


                        upcoord = upcoord_repeat.xy;
                        downcoord =downcoord_repeat.xy;
                        leftcoord = leftcoord_repeat.xy;
                        rightcoord = rightcoord_repeat.xy;


                        float count = 1.0;


                        float heightup = getHeight(upcoord,delta);
                        float heightdown = getHeight(downcoord,delta);
                        float heightleft = getHeight(leftcoord,delta);
                        float heightright = getHeight(rightcoord,delta);

                        if(upcoord_repeat.z>0.9) {height+=heightup;count+=1.0;}
                        if(downcoord_repeat.z>0.9) {height+=heightdown;count+=1.0;}
                        if(leftcoord_repeat.z>0.9) {height+=heightleft;count+=1.0;}
                        if(rightcoord_repeat.z>0.9) {height+=heightright;count+=1.0;}

                        height = height/count;


                        gridPosition.y=height;

                        position_world = (u_model*vec4(gridPosition,1.0)).xyz;

                        gl_Position = u_modelViewPerspective * vec4(gridPosition, 1.0);
                    }
                </script>
                <script id="fs_render_lowres" type="x-shader/x-fragment">
                    precision highp float;

                    uniform sampler2D u_simData;
                    uniform float u_time;

                    uniform vec4 sky_params1;
                    uniform vec4 sky_params2;
                    uniform vec4 sky_params3;
                    uniform vec4 sky_params4;
                    uniform vec4 sky_params5;
                    uniform vec4 sky_params6;

                    uniform mat4 u_model;
                    uniform mat4 u_view;
                    uniform mat4 u_persp;
                    uniform mat4 u_modelViewInverse;
                    uniform mat4 u_normal;
                    uniform mat4 u_modelViewPerspective;
                    uniform float u_meshSize;
                    uniform float u_patchSize;

                    uniform vec3 eyePos;
                    uniform vec3 u_sunPos;

                    uniform vec3 u_oceancolor;

                    varying vec3 position_world;
                    varying vec3 gridPosition;
                    varying vec2 fTexcoord;

                    vec3 repeatCoord(vec2 coord)
                    {
                        vec3 result = vec3(coord,0.0);
                        if(result.x>1.0) {result.x-=1.0; result.z=1.0;}
                        if(result.x<0.0) {result.x+=1.0;result.z=1.0;}
                        if(result.y>1.0) {result.y-=1.0;result.z=1.0;}
                        if(result.y<0.0) {result.y+=1.0;result.z=1.0;}
                        return result;
                    }

                    vec3 hdr (vec3 color, float exposure) {
                    return 1.0 - exp(-color * exposure);
                }
                    //////SKY CALCULATION
                    vec3 calcExtinction(float dist) {
                    return exp(dist * sky_params6.xyz);
                }
                    vec3 calcScattering(float cos_theta) {
                    float r_phase = (cos_theta * cos_theta) * sky_params6.w + sky_params6.w;
                    float m_phase = sky_params1.w * pow(sky_params2.w * cos_theta + sky_params3.w, -1.5);
                    return sky_params2.xyz * r_phase + (sky_params3.xyz * m_phase);
                }
                    float baseOpticalDepth(in vec3 ray) {
                    float a1 = sky_params4.x * ray.y;
                    return sqrt(a1 * a1 + sky_params4.w) - a1;
                }
                    float opticalDepth(in vec3 pos, in vec3 ray) {
                    pos.y += sky_params4.x;
                    float a0 = sky_params4.y - dot(pos, pos);
                    float a1 = dot(pos, ray);
                    return sqrt(a1 * a1 + a0) - a1;
                }
                    vec3 getSkyColor(vec3 view_vec)
                    {
                        vec3 sun_vector = normalize(u_sunPos);
                        float cos_theta = dot(view_vec, sun_vector);
                        float ray_dist = baseOpticalDepth(view_vec);

                        vec3 extinction = calcExtinction(ray_dist);
                        vec3 light_ray_pos = view_vec * (ray_dist * sky_params4.z);
                        float light_ray_dist = opticalDepth(light_ray_pos, sun_vector);
                        float light_ray_dist_full = opticalDepth(view_vec * ray_dist, sun_vector);
                        light_ray_dist = max(light_ray_dist, light_ray_dist_full);
                        vec3 incoming_light = calcExtinction(light_ray_dist);

                        vec3 scattering = calcScattering(cos_theta);
                        scattering *= 1.0 - extinction;

                        vec3 in_scatter = incoming_light * scattering;

                        float sun_strength = clamp(cos_theta * sky_params1.x + sky_params1.y, 0.0, 1.0);
                        sun_strength *= sun_strength;
                        vec3 sun_disk = extinction * sun_strength;
                        return sky_params5.xyz * (sky_params5.w * sun_disk + in_scatter);
                    }
                    ////////////END SKY CALCULATION

                    float signCorrection(vec2 texCoord,float delta)
                    {
                        vec2 texCoord1 = vec2(floor((texCoord - vec2(delta*0.5)) * 512.0 + 0.5));
                        float signCorrection = abs(texCoord1.x + texCoord1.y - 2.0 * floor((texCoord1.x + texCoord1.y) / 2.0 + 1e-6)) < 0.1 ? -1.0 : 1.0;
                        return signCorrection;
                    }

                    float getHeight(vec2 coord, float delta)
                    {
                        return signCorrection(coord,delta) * texture2D(u_simData, coord).r;
                    }

                    void main(void)
                    {
                        float delta = 1.0/512.0;
                        float patchsize = u_patchSize;
                        gl_FragColor.w=1.0;
                        vec2 mytexcoord = fTexcoord;

                        vec2 upcoord    = mytexcoord + vec2(0.0, delta);
                        vec2 downcoord  = mytexcoord - vec2(0.0, delta);
                        vec2 leftcoord  = mytexcoord - vec2(delta, 0.0);
                        vec2 rightcoord = mytexcoord + vec2(delta, 0.0);

                        vec3 upcoord_repeat = repeatCoord(upcoord);
                        vec3 downcoord_repeat = repeatCoord(downcoord);
                        vec3 leftcoord_repeat = repeatCoord(leftcoord);
                        vec3 rightcoord_repeat = repeatCoord(rightcoord);


                        upcoord = upcoord_repeat.xy;
                        downcoord =downcoord_repeat.xy;
                        leftcoord = leftcoord_repeat.xy;
                        rightcoord = rightcoord_repeat.xy;

                        vec3 positionModel = vec3(gridPosition.x, 0.0, gridPosition.z);

                        float height = getHeight(mytexcoord,delta);
                        positionModel.y=height;


                        float heightup = getHeight(upcoord,delta);
                        float heightdown = getHeight(downcoord,delta);
                        float heightleft = getHeight(leftcoord,delta);
                        float heightright = getHeight(rightcoord,delta);

                        vec3 upPositionModel =    vec3(gridPosition.x,                 0.0,    gridPosition.z+delta*patchsize);
                        vec3 downPositionModel =  vec3(gridPosition.x,                 0.0,  gridPosition.z-delta*patchsize);
                        vec3 leftPositionModel =  vec3(gridPosition.x-delta*patchsize, 0.0,  gridPosition.z);
                        vec3 rightPositionModel = vec3(gridPosition.x+delta*patchsize, 0.0, gridPosition.z);

                        upPositionModel.y=heightup;
                        downPositionModel.y = heightdown;
                        leftPositionModel.y =  heightleft;
                        rightPositionModel.y = heightright;
                        vec3 upPositionWorld =(u_model*vec4(upPositionModel,1.0)).xyz;
                        vec3 downPositionWorld =(u_model*vec4(downPositionModel,1.0)).xyz;
                        vec3 leftPositionWorld =(u_model*vec4(leftPositionModel,1.0)).xyz;
                        vec3 rightPositionWorld =(u_model*vec4(rightPositionModel,1.0)).xyz;



                        vec3 totalNormal=vec3(0.0);
                        totalNormal+=normalize(cross(position_world-leftPositionWorld,upPositionWorld-position_world));
                        totalNormal+=normalize(cross(position_world-upPositionWorld,rightPositionWorld-position_world));
                        totalNormal+=normalize(cross(position_world-rightPositionWorld,downPositionWorld-position_world));
                        totalNormal+=normalize(cross(position_world-downPositionWorld,leftPositionWorld-position_world));

                        totalNormal=normalize(totalNormal);
                        vec3 normal_world = totalNormal;


                        vec3 outcolor=vec3(0.0);

                        vec3 sunpos = u_sunPos;
                        vec3 incidentdir = normalize(position_world-sunpos);


                        vec3 standardnormal = -normalize(normal_world);

                        vec3 reflectiondir = normalize(incidentdir-2.0*standardnormal*dot(incidentdir,standardnormal));

                        vec3 eyepos = eyePos;


                        vec3 eyeraydir = normalize(eyepos-position_world);          ///from point to eye
                        vec3 directionalLightDir = normalize(vec3(0.0,1.0,0.0));
                        float specular1 = pow(max(0.01,dot(eyeraydir,reflectiondir)),5000.0);


                        vec3 ocean_color = u_oceancolor;

                        vec3 sky_color = vec3(3.2, 9.6, 12.8)*0.8;


                        vec3 view = normalize(eyePos - position_world);

                        float incidentAngle=acos(abs(dot(standardnormal, view)));
                        float transmittanceAngle = asin(sin(incidentAngle)/1.33);      //1.33 is the water transmittance ratio
                        float temp1 = tan(incidentAngle-transmittanceAngle)/tan(incidentAngle+transmittanceAngle);
                        float temp2 = sin(incidentAngle-transmittanceAngle)/sin(incidentAngle+transmittanceAngle);

                        float fresnel =(temp1*temp1+temp2*temp2)*0.5;


                        ///use negative eyeraydir for the direction from eye to point
                        /// and get the reflection direction
                        vec3 eyeReflDir = normalize(-eyeraydir-2.0*standardnormal*dot(-eyeraydir,standardnormal));
                        eyeReflDir.y=abs(eyeReflDir.y);
                        vec3 sun_color = getSkyColor(normalize(sunpos));
                        sky_color = getSkyColor(eyeReflDir)*10.0;


                        vec3 sky = fresnel * sky_color;




                        float specular2 = max(0.0,dot(standardnormal, directionalLightDir));
                        //specular2 = pow(specular2,1.0);

                        vec3 water = (1.0 - fresnel) * ocean_color  * specular2*sky_color;

                        outcolor = 100.0*specular1*sun_color + sky + water;
                        gl_FragColor = vec4(hdr(outcolor,0.35), 1.0);
                        return;
                        float density = 6.0;
                        float z = gl_FragCoord.z/gl_FragCoord.w/1000.0;
                        float fog=z*density;
                        vec4 fogcolor= vec4(1.0,1.0,1.0,0.0);
                        gl_FragColor = mix(fogcolor, gl_FragColor, clamp(1.0-fog,0.0,1.0));

                    }
                </script>
                <script id="skyFS" type="x-shader/x-fragment">
                    precision highp float;

                    uniform vec4 sky_params1;
                    uniform vec4 sky_params2;
                    uniform vec4 sky_params3;
                    uniform vec4 sky_params4;
                    uniform vec4 sky_params5;
                    uniform vec4 sky_params6;

                    uniform vec3 eyePos;
                    uniform vec3 u_sunPos;
                    uniform vec3 eyeCenter;
                    uniform vec3 eyeUp;
                    uniform float fov;

                    varying vec2 f_Pos;

                    vec3 get_Pixel_Dir(){
                    vec3 view = normalize(eyeCenter-eyePos);
                    vec3 A= cross(view,eyeUp);
                    vec3 B= cross(A,view);
                    vec3 M=eyePos+view;
                    vec3 V=B*(length(view)*tan(fov)/length(B));
                    vec3 H=-A*(length(view)*tan(fov)/length(A));
                    float t1=f_Pos.x;
                    float t2=f_Pos.y;
                    vec3 P=M-t1*H+t2*V;
                    vec3 R=normalize(P-eyePos);
                    return R;
                }
                    vec3 calcExtinction(float dist) {
                    return exp(dist * sky_params6.xyz);
                }
                    vec3 calcScattering(float cos_theta) {
                    float r_phase = (cos_theta * cos_theta) * sky_params6.w + sky_params6.w;
                    float m_phase = sky_params1.w * pow(sky_params2.w * cos_theta + sky_params3.w, -1.5);
                    return sky_params2.xyz * r_phase + (sky_params3.xyz * m_phase);
                }
                    float baseOpticalDepth(in vec3 ray) {
                    float a1 = sky_params4.x * ray.y;
                    return sqrt(a1 * a1 + sky_params4.w) - a1;
                }
                    float opticalDepth(in vec3 pos, in vec3 ray) {
                    pos.y += sky_params4.x;
                    float a0 = sky_params4.y - dot(pos, pos);
                    float a1 = dot(pos, ray);
                    return sqrt(a1 * a1 + a0) - a1;
                }
                    vec3 getColor(vec3 view_vec)
                    {
                        vec3 sun_vector = normalize(u_sunPos);
                        float cos_theta = dot(view_vec, sun_vector);
                        float ray_dist = baseOpticalDepth(view_vec);

                        vec3 extinction = calcExtinction(ray_dist);
                        vec3 light_ray_pos = view_vec * (ray_dist * sky_params4.z);
                        float light_ray_dist = opticalDepth(light_ray_pos, sun_vector);
                        float light_ray_dist_full = opticalDepth(view_vec * ray_dist, sun_vector);
                        light_ray_dist = max(light_ray_dist, light_ray_dist_full);
                        vec3 incoming_light = calcExtinction(light_ray_dist);

                        vec3 scattering = calcScattering(cos_theta);
                        scattering *= 1.0 - extinction;

                        vec3 in_scatter = incoming_light * scattering;

                        float sun_strength = clamp(cos_theta * sky_params1.x + sky_params1.y, 0.0, 1.0);
                        sun_strength *= sun_strength;
                        vec3 sun_disk = extinction * sun_strength;
                        return sky_params5.xyz * (sky_params5.w * sun_disk + in_scatter);
                    }
                    void main()
                    {
                        vec3 view_vec = get_Pixel_Dir();
                        vec3 outcolor = getColor(view_vec);
                        gl_FragColor = vec4(outcolor,1.0);
                    }
                </script>
                <script src="userinterface.js" type="text/javascript"></script>
                <script src="dynamicDrawing.js" type="text/javascript"></script>
                <script src="water_mesh.js" type="text/javascript"></script>


    </head>

    <body onload="webGLStart();">

    <div id="message" style="position:absolute;top:100px"></div> <!-- Pixel offset to avoid FPS counter -->
    <div id = "debug_text"></div>
    <div id = "parameterSet" style="position:fixed;top:50px;left:1050px;width: 300px;">

        <table style="width: 100%">
            <tr>
                <div id="testfield" style="font-size: 25px;">
                    <b>Parameter Set</b>
                </div>

            </tr>
            <tr style="width: 100%">
                <td style="width:30%">Sun Position</td>
                <td style="width:30%">Azimuth<div id = "sunpos_azimuth" style="width:80%"></div></td>
                <td style="width:30%">Zenith<div id = "sunpos_zenith" style="width:80%"></div></td>
            </tr>

            <tr>



            </tr>
            <tr style="width: 100%">
                <td>Sky Parameters</td>
                <td style="width:30%">Density<div id = "sky_density" style="width:80%"></div></td>
                <td style="width:30%">Clarity<div id = "sky_clarity" style="width:80%"></div></td>
                <td style="width:30%">Pollution<div id = "sky_pollution" style="width:80%"></div></td>
            </tr>
            <tr style="width: 100%">
                <td>Water Color</td>
                <td style="width:30%">Red<div id = "water_r" style="width:80%"></div></td>
                <td style="width:30%">Green<div id = "water_g" style="width:80%"></div></td>
                <td style="width:30%">Blue<div id = "water_b" style="width:80%"></div></td>
            </tr>
            <tr style="width: 100%">
                <td>Wind Parameters</td>
                <td style="width:30%">Direction<div id = "wind_dir" style="width:80%"></div></td>
                <td style="width:30%">Speed<div id = "wind_speed" style="width:80%"></div></td>
            </tr>

        </table>


    </div>
    <canvas id="canvas1" style="border: none;" width="1024" height="1024" tabindex="1"></canvas>

    </body>

</html>

