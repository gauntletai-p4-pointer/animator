# Friction
- creating game assets, especially animating 2D game characters, effects, or environments, takes a ton of time (even if you are an artist)
- creating game assets takes a ton of specialized skill
- software, too, to create game assets has a learning curve in addition to creating the art itself
- hiring an artist can be expensive or have a loose feedback loop

# SpikyPOVs
- there would be a whole new market, and a lot more indie game devs, if we could enable programmers to build games without needing to invest the time or talent in art creation
- deformation based animation > animating sprites frame-by-frame
	- or, an expert view but different from layperson (eg., [[State of the art in 2D character animations]] mentions Spine2D as a leading commercial option)
	- our spiky take: **leveraging an approach like Spine's, with transformations/deformations, skeletons, inverse kinematic constraints, etc. can fix a lot of AI generation issues**

# Approaches considered
- animating SVGs
	- generation of SVGs is lower quality than generation of raster images
	- relative to Spine2D, it's unclear how do complex animations
- image -> sprite sheet
	- you can try in ChatGPT... it doesn't handle the logical sequence of an animation or character consistency well at all
- image + pose -> frame
	- this approach probably could be further developed, but relies on bespoke pose analysis models
- image -> 3D -> animations -> 2D capture
	- too much scope creep, although this is how a lot of animation is done in the industry
- .psd -> Spine2D -> animations
	- to get started, we are skipping the .psd and working with an existing Spine2D character.