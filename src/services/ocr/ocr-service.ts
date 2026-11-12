export interface OcrCandidateFields {
  distributor?: string;
  invoiceNumber?: string;
  periodStart?: string;
  periodEnd?: string;
  consumptionKwh?: number;
  previousReading?: number;
  currentReading?: number;
  declaredTotal?: number;
  rawText?: string;
}

export interface OcrResult {
  success: boolean;
  fields: OcrCandidateFields;
  confidence: 'Alta' | 'Media' | 'Baja' | 'No Disponible';
  message: string;
}

export interface OcrService {
  isAvailable(): Promise<boolean>;
  recognizeImage(imageUri: string): Promise<OcrResult>;
}

/**
 * Web implementation of OCR Service.
 * Transparent: Clearly informs user that native Android ML Kit OCR will activate in the APK/Capacitor build,
 * and allows manual verification and attachment on Web without simulating artificial OCR text.
 */
export class WebOcrService implements OcrService {
  public async isAvailable(): Promise<boolean> {
    // In pure browser environment without Capacitor Native ML Kit plugin
    return false;
  }

  public async recognizeImage(imageUri: string): Promise<OcrResult> {
    // Return honest unverified status on web
    return {
      success: false,
      fields: {},
      confidence: 'No Disponible',
      message: 'El reconocimiento óptico nativo con Google ML Kit está preparado para la compilación Android en Capacitor. En la versión Web, el documento se adjunta para auditoría visual y los campos se confirman manualmente.',
    };
  }
}

export const ocrService: OcrService = new WebOcrService();
