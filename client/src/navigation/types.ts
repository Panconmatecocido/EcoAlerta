// src/navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Parámetros de cada pantalla del flujo de reporte ambiental.
 * - ReportCamera: punto de entrada, sin parámetros.
 * - ReportForm: recibe la URI de la foto capturada.
 * - ReportConfirmation: pantalla final, sin parámetros.
 */
export type ReportStackParamList = {
  ReportCamera: undefined;
  ReportForm: { fotoUri: string };
  ReportConfirmation: undefined;
};

/** Props de la pantalla de cámara del reporte (Req 2.3, 8.1) */
export type ReportCameraScreenProps = NativeStackScreenProps<
  ReportStackParamList,
  'ReportCamera'
>;

/** Props de la pantalla del formulario del reporte (Req 2.3, 8.1) */
export type ReportFormScreenProps = NativeStackScreenProps<
  ReportStackParamList,
  'ReportForm'
>;

/** Props de la pantalla de confirmación del reporte (Req 2.3, 8.1) */
export type ReportConfirmationScreenProps = NativeStackScreenProps<
  ReportStackParamList,
  'ReportConfirmation'
>;
