import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);
  modelsLoaded = true;
}

export async function getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | undefined> {
  const detection = await faceapi.detectSingleFace(imageElement).withFaceLandmarks().withFaceDescriptor();
  return detection?.descriptor;
}

export function findBestMatch(descriptor: Float32Array, labeledDescriptors: { id: string, descriptor: Float32Array }[]): { id: string, distance: number } | null {
  if (labeledDescriptors.length === 0) return null;
  
  const faceMatcher = new faceapi.FaceMatcher(
    labeledDescriptors.map(ld => new faceapi.LabeledFaceDescriptors(ld.id, [ld.descriptor])),
    0.6 // threshold
  );
  
  const match = faceMatcher.findBestMatch(descriptor);
  if (match.label === 'unknown') return null;
  return { id: match.label, distance: match.distance };
}
