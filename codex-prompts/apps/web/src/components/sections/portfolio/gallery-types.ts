export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

/** Translated labels (the gallery is a client component; messages stay on the server). */
export interface GalleryLabels {
  /** Per image: "Open image 2 of 6: …". */
  open: string[];
  /** Per image: "Image 2 of 6". */
  counter: string[];
  close: string;
  previous: string;
  next: string;
}
