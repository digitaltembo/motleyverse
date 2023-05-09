#version 300 es
precision highp sampler2DArray;

in highp float vTextureIndex;
in highp vec2 vTextureCoord;
in highp vec3 vLighting;

uniform sampler2DArray uSampler;

out highp vec4 out_color;

void main(void) {
  highp vec4 texelColor = texture(uSampler, vec3(vTextureCoord, vTextureIndex));

  out_color = vec4(texelColor.rgb * vLighting, texelColor.a);
}