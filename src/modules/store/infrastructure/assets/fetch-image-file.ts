/**
 * Fetch remote image bytes into a File for generation inputs.
 */

export async function fetchImageAsFile(
  url: string,
  filename: string,
): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`)
  }
  const blob = await response.blob()
  const type = blob.type || 'image/jpeg'
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
  const safeName = filename.includes('.') ? filename : `${filename}.${extension}`
  return new File([blob], safeName, { type })
}
