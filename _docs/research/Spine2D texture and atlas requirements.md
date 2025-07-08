---
link: https://www.perplexity.ai/search/does-spine2d-require-a-single-fpoSGVr8ROW004W23fzqZA
---

## Does Spine2D Require a Single Texture File and Atlas?

**Spine2D** is designed around the use of a texture atlas for efficient rendering. When you export a Spine project, it typically generates:

- A `.json` or `.skel` file (skeleton/animation data)
    
- An `.atlas` file (atlas metadata)
    
- One or more `.png` images (the atlas "pages" containing packed images)[1](http://en.esotericsoftware.com/spine-texture-packer)[2](http://en.esotericsoftware.com/spine-atlas-format)
    

The atlas file tells the runtime where each sprite image is located within the atlas images. This approach minimizes texture binds at runtime and is the standard workflow for Spine2D[1](http://en.esotericsoftware.com/spine-texture-packer).

## Can Spine2D Load Individual PNGs Instead of an Atlas?

By default, **Spine2D expects images to be packed into an atlas** and referenced by the `.atlas` file. However, there are some nuances and workarounds:

- **Editor Workflow:** In the Spine editor, you can work with individual PNGs during animation creation. But when exporting for use in a game engine or runtime, you are expected to pack these into an atlas[1](http://en.esotericsoftware.com/spine-texture-packer)[2](http://en.esotericsoftware.com/spine-atlas-format).
    
- **Runtime Loading:** Most official Spine runtimes (like spine-c, spine-csharp, Unity, etc.) require an atlas file to load and map images for rendering. They do not natively support loading individual PNGs at runtime instead of an atlas[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas)[4](https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas).
    
- **Custom Solutions:** Advanced users can write their own attachment loaders to bypass the atlas requirement, but this is non-trivial and not supported out-of-the-box. This approach is generally only used for highly custom workflows, such as using Spine for animation data only (not rendering), or for UI systems where you want to drive external assets[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas)[4](https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas).
    
- **Packing Options:** You can configure the texture packer to avoid merging subdirectories, which allows you to keep images separate in the atlas, but the output is still an atlas and not a set of individual PNGs[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas).
    

## Summary Table

|Workflow Stage|Individual PNGs|Atlas Required|Notes|
|---|---|---|---|
|Spine Editor|Yes|No|You can animate with individual PNGs before export[1](http://en.esotericsoftware.com/spine-texture-packer).|
|Export for Runtime|No|Yes|Exporting creates an atlas and atlas file for use in game runtimes[1](http://en.esotericsoftware.com/spine-texture-packer).|
|Runtime (Default)|No|Yes|Official runtimes expect an atlas for rendering[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas)[4](https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas).|
|Runtime (Custom)|Possible|No|Requires custom code, not supported by default[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas).|

## Key Points

- **Standard practice:** Use a texture atlas for runtime use in Spine2D[1](http://en.esotericsoftware.com/spine-texture-packer)[2](http://en.esotericsoftware.com/spine-atlas-format).
    
- **Individual PNGs:** Only supported during animation creation in the editor, not at runtime.
    
- **Custom loading:** Possible but complex, requiring custom runtime code and not recommended unless you have specific needs[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas)[4](https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas).
    

If you need to load individual PNGs at runtime, you will need to implement a custom attachment loader in your chosen runtime, which is an advanced use case and not officially documented for most users[3](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas)[4](https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas).

1. [http://en.esotericsoftware.com/spine-texture-packer](http://en.esotericsoftware.com/spine-texture-packer)
2. [http://en.esotericsoftware.com/spine-atlas-format](http://en.esotericsoftware.com/spine-atlas-format)
3. [https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas](https://en.esotericsoftware.com/forum/d/4066-is-there-a-way-to-load-an-animation-without-atlas)
4. [https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas](https://en.esotericsoftware.com/forum/d/15424-how-to-use-spine-without-atlas)
5. [https://atlas.co/docs/upload-data/](https://atlas.co/docs/upload-data/)
6. [https://en.esotericsoftware.com/forum/d/25464-using-existing-spritesheetatlas-with-spine](https://en.esotericsoftware.com/forum/d/25464-using-existing-spritesheetatlas-with-spine)
7. [https://en.esotericsoftware.com/forum/d/24944-atlas-requirement](https://en.esotericsoftware.com/forum/d/24944-atlas-requirement)
8. [https://en.esotericsoftware.com/forum/d/9835-separated-atlas-for-each-skin](https://en.esotericsoftware.com/forum/d/9835-separated-atlas-for-each-skin)
9. [https://en.esotericsoftware.com/forum/d/13051-spine-38-export-attachments-atlas-maintaining-image-folders](https://en.esotericsoftware.com/forum/d/13051-spine-38-export-attachments-atlas-maintaining-image-folders)
10. [https://www.html5gamedevs.com/topic/47587-loading-atlases-and-spine-animations-from-base64-assets/](https://www.html5gamedevs.com/topic/47587-loading-atlases-and-spine-animations-from-base64-assets/)
11. [https://en.esotericsoftware.com/forum/d/18553-obtaining-spine-atlases](https://en.esotericsoftware.com/forum/d/18553-obtaining-spine-atlases)
12. [https://forum.defold.com/t/how-to-dynamically-load-png-for-spine-2d/76040](https://forum.defold.com/t/how-to-dynamically-load-png-for-spine-2d/76040)
13. [https://en.esotericsoftware.com/forum/d/15917-how-to-match-an-existing-atlas](https://en.esotericsoftware.com/forum/d/15917-how-to-match-an-existing-atlas)
14. [https://www.youtube.com/watch?v=Im0RB6musvA](https://www.youtube.com/watch?v=Im0RB6musvA)
15. [https://esotericsoftware.com/forum/d/26560-spine-ts-loading-png-assets-as-needed-for-web](https://esotericsoftware.com/forum/d/26560-spine-ts-loading-png-assets-as-needed-for-web)
16. [https://gamemaker.zendesk.com/hc/en-us/articles/360022454671-Spine-Using-Multiple-Texture-Pages](https://gamemaker.zendesk.com/hc/en-us/articles/360022454671-Spine-Using-Multiple-Texture-Pages)
17. [http://en.esotericsoftware.com/spine-unity-assets](http://en.esotericsoftware.com/spine-unity-assets)
18. [https://github.com/pixijs/pixi-spine/issues/169](https://github.com/pixijs/pixi-spine/issues/169)
19. [https://en.esotericsoftware.com/forum/d/24862-export-animation-to-png-and-ensure-packing-in-single-atlas](https://en.esotericsoftware.com/forum/d/24862-export-animation-to-png-and-ensure-packing-in-single-atlas)