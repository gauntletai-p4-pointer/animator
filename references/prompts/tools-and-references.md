In many cases, we will want to add attachments or skins that do not exist yet. We should add a References section on the lefthand side underneath "Spine2D Animation Studio" and "Theme: <setting>". It should allow the user to upload reference images and scroll through them in a visual list (as well as remove them with an trash button in the corner of each image that appears on hover). For now, it can just use local state. We will worry about persisting and loading to a database later. 

Then, when the user makes a request that makes a reference to an asset, we should check whether it exists. If it does not exist, we should use the reference image or image(s) to create it with a call to gpt-image-1.

---

How it works now:

1. User uploads reference images in the left panel
2. When requesting "wear a red hat", the AI will:
  - First check if 'hat_red' attachment exists
  - If not, generate it using DALL-E (with reference images as context)
  - Then apply the appearance change
3. If an attachment is missing, the user gets an alert instead of a console error

Next steps for full implementation:

1. Integrate actual DALL-E API calls (currently placeholder)
2. Process generated images into Spine-compatible assets
3. Dynamic attachment loading into the skeleton
4. Persist reference images to a database
5. Save generated assets for reuse

The foundation is now in place for a complete asset generation workflow!

---