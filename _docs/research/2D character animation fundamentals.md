---
link: https://claude.ai/chat/9b544ab8-42e9-44ab-ba23-cfa313777214
---
Here are the fundamental operations for animating a 2D character:

**Transform Operations**
- Translation (move position)
- Rotation (around pivot points)
- Scale (uniform or non-uniform stretching)
- Skew/shear (diagonal distortion)

**Deformation Operations**
- Bone/skeletal deformation (IK/FK rigging)
- Mesh warping (free-form deformation)
- Squash and stretch
- Bend/curve deformation

**Sprite/Image Operations**
- Frame swapping (for sprite sheets)
- Layer ordering (z-depth)
- Opacity/transparency
- Blending modes
- Color transforms (tint, brightness, contrast)

**Path Operations**
- Follow path (movement along curves)
- Path deformation (deform along curve)

**Masking Operations**
- Clipping masks
- Alpha masks
- Reveal/wipe effects

**Interpolation Operations**
- Linear interpolation
- Ease in/out curves
- Custom bezier curves
- Step/hold interpolation

**Composite Operations**
- Parent-child hierarchies
- Constraint systems (look-at, position, scale constraints)
- Blend shapes/morph targets

These operations can be combined and sequenced to create complex animations. Most 2D animation software implements these as the building blocks, whether you're doing frame-by-frame animation, puppet animation, or motion graphics. The key is that each operation is atomic and can be parameterized over time.