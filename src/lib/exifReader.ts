/**
 * Pure client-side EXIF parser and Geolocation helper for SiteProof AI
 * Extracts GPS coordinates (Latitude, Longitude) and capture timestamp from JPEG images.
 */

export interface ParsedExifData {
  dateTime?: string;
  latitude?: number;
  longitude?: number;
  hasGps: boolean;
  cameraMake?: string;
  cameraModel?: string;
}

export async function extractExifFromImage(file: File): Promise<ParsedExifData> {
  return new Promise((resolve) => {
    // Only JPEG files have standard APP1 EXIF markers
    if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
      resolve({ hasGps: false });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve({ hasGps: false });
          return;
        }

        const view = new DataView(buffer);
        // Verify JPEG SOI marker (0xFFD8)
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve({ hasGps: false });
          return;
        }

        let offset = 2;
        const length = view.byteLength;

        while (offset < length - 4) {
          const marker = view.getUint16(offset, false);
          offset += 2;

          // Check for APP1 Marker (0xFFE1) containing EXIF
          if (marker === 0xFFE1) {
            const exifLength = view.getUint16(offset, false);
            offset += 2;

            // Check for "Exif\0\0" header (0x45786966)
            if (view.getUint32(offset, false) === 0x45786966) {
              const tiffOffset = offset + 6;
              const result = parseTiffHeader(view, tiffOffset);
              resolve(result);
              return;
            }
            offset += exifLength - 2;
          } else if ((marker & 0xFF00) === 0xFF00 && marker !== 0xFF00) {
            // Skip other JPEG markers
            const sectionLength = view.getUint16(offset, false);
            offset += sectionLength;
          } else {
            break;
          }
        }

        resolve({ hasGps: false });
      } catch {
        resolve({ hasGps: false });
      }
    };

    reader.onerror = () => resolve({ hasGps: false });
    // Read first 128KB which contains EXIF header
    reader.readAsArrayBuffer(file.slice(0, 131072));
  });
}

function parseTiffHeader(view: DataView, tiffOffset: number): ParsedExifData {
  try {
    const byteOrder = view.getUint16(tiffOffset, false);
    const littleEndian = byteOrder === 0x4949; // "II" = Little Endian, "MM" = Big Endian

    const ifdOffset = view.getUint32(tiffOffset + 4, littleEndian);
    let gpsOffset: number | null = null;
    let exifSubIfdOffset: number | null = null;
    let dateTime: string | undefined = undefined;

    // Read IFD0
    const ifd0Start = tiffOffset + ifdOffset;
    const ifd0Entries = view.getUint16(ifd0Start, littleEndian);

    for (let i = 0; i < ifd0Entries; i++) {
      const entryOffset = ifd0Start + 2 + i * 12;
      const tag = view.getUint16(entryOffset, littleEndian);

      if (tag === 0x8769) {
        // Exif IFD Pointer
        exifSubIfdOffset = view.getUint32(entryOffset + 8, littleEndian);
      } else if (tag === 0x8825) {
        // GPS IFD Pointer
        gpsOffset = view.getUint32(entryOffset + 8, littleEndian);
      } else if (tag === 0x0132) {
        // DateTime
        const dtValOffset = view.getUint32(entryOffset + 8, littleEndian);
        dateTime = readAsciiString(view, tiffOffset + dtValOffset, 20);
      }
    }

    // Check SubIFD for DateTimeOriginal (0x9003)
    if (exifSubIfdOffset) {
      const subIfdStart = tiffOffset + exifSubIfdOffset;
      const subEntries = view.getUint16(subIfdStart, littleEndian);
      for (let i = 0; i < subEntries; i++) {
        const entryOffset = subIfdStart + 2 + i * 12;
        const tag = view.getUint16(entryOffset, littleEndian);
        if (tag === 0x9003 || tag === 0x9004) {
          const valOffset = view.getUint32(entryOffset + 8, littleEndian);
          dateTime = readAsciiString(view, tiffOffset + valOffset, 20);
        }
      }
    }

    // Parse GPS tags
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (gpsOffset) {
      const gpsStart = tiffOffset + gpsOffset;
      const gpsEntries = view.getUint16(gpsStart, littleEndian);
      let latRef = 'N';
      let lonRef = 'E';
      let latDeg: number[] | null = null;
      let lonDeg: number[] | null = null;

      for (let i = 0; i < gpsEntries; i++) {
        const entryOffset = gpsStart + 2 + i * 12;
        const tag = view.getUint16(entryOffset, littleEndian);

        if (tag === 0x0001) {
          // GPSLatitudeRef
          latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
        } else if (tag === 0x0002) {
          // GPSLatitude (3 rationals)
          const valOffset = view.getUint32(entryOffset + 8, littleEndian);
          latDeg = readGpsRationals(view, tiffOffset + valOffset, littleEndian);
        } else if (tag === 0x0003) {
          // GPSLongitudeRef
          lonRef = String.fromCharCode(view.getUint8(entryOffset + 8));
        } else if (tag === 0x0004) {
          // GPSLongitude (3 rationals)
          const valOffset = view.getUint32(entryOffset + 8, littleEndian);
          lonDeg = readGpsRationals(view, tiffOffset + valOffset, littleEndian);
        }
      }

      if (latDeg && latDeg.length === 3) {
        latitude = latDeg[0] + latDeg[1] / 60 + latDeg[2] / 3600;
        if (latRef === 'S') latitude = -latitude;
      }

      if (lonDeg && lonDeg.length === 3) {
        longitude = lonDeg[0] + lonDeg[1] / 60 + lonDeg[2] / 3600;
        if (lonRef === 'W') longitude = -longitude;
      }
    }

    return {
      dateTime: formatExifDate(dateTime),
      latitude: latitude ? Number(latitude.toFixed(6)) : undefined,
      longitude: longitude ? Number(longitude.toFixed(6)) : undefined,
      hasGps: Boolean(latitude && longitude),
    };
  } catch {
    return { hasGps: false };
  }
}

function readAsciiString(view: DataView, offset: number, maxLen: number): string {
  let str = '';
  for (let i = 0; i < maxLen; i++) {
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

function readGpsRationals(view: DataView, offset: number, littleEndian: boolean): number[] {
  const result: number[] = [];
  for (let i = 0; i < 3; i++) {
    const num = view.getUint32(offset + i * 8, littleEndian);
    const den = view.getUint32(offset + i * 8 + 4, littleEndian);
    result.push(den !== 0 ? num / den : 0);
  }
  return result;
}

function formatExifDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  // Format: "YYYY:MM:DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  const parts = dateStr.split(' ');
  if (parts.length >= 2) {
    const datePart = parts[0].replace(/:/g, '-');
    return `${datePart}T${parts[1]}`;
  }
  return dateStr;
}

/**
 * Get current browser geolocation with high accuracy
 */
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (!('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  });
}
