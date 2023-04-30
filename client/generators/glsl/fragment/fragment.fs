#version 300 es

in highp vec2 vTextureCoord;
in highp vec3 vLighting;

uniform sampler2D uSampler;

out vec4 out_color;

void main(void) {
  highp vec4 texelColor = texture(uSampler, vTextureCoord);

  out_color = vec4(texelColor.rgb * vLighting, texelColor.a);
}