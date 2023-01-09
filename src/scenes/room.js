let femaleSprite

const roomScene = {
  preload: () => {
    femaleSprite = loadImage('assets/female_sprite_by_sutemo.png')
  },
  draw: () => {
    background('#aabbcc')
    const ratio = femaleSprite.width / femaleSprite.height
    image(femaleSprite, 0, 0, 200, 200 / ratio)
  },
}
