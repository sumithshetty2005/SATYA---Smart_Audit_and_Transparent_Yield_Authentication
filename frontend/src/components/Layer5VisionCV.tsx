import React, { useState, useRef } from 'react';
import {
  MapPin,
  Ruler,
  Box,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  RefreshCw,
  ShieldCheck,
  Camera,
  Info,
  Check,
  Copy,
} from 'lucide-react';
import type { InstitutionProfile, CADPolygon, YOLOAsset, EXIFGeoData } from '../types/compliance';

interface Props {
  institution?: InstitutionProfile;
  scenarioData?: {
    cadTotalAreaSqm: number;
    carpetAreaSqm: number;
    circulationRatio: number;
    nearestFireExitM: number;
    geofenceValid: boolean;
    gpsCoords: string;
    gpsDistanceMeters: number;
    polygons: CADPolygon[];
    yoloDetections: YOLOAsset[];
  };
  initialCADFile?: File | null;
  initialPhotoFile?: File | null;
}

const BACKEND_BASE = '';

export const Layer5VisionCV: React.FC<Props> = ({
  institution,
  scenarioData,
}) => {
  // Baseline data from institution or defaults
  const defaultCad = institution?.layer5?.cadFloorPlan || (scenarioData ? {
    totalAreaSqm: scenarioData.cadTotalAreaSqm,
    carpetAreaSqm: scenarioData.carpetAreaSqm,
    circulationRatio: scenarioData.circulationRatio,
    requiredCirculationRatio: 0.25,
    nearestFireExitDistanceM: scenarioData.nearestFireExitM,
    maxAllowedEgressDistanceM: 30,
    polygons: scenarioData.polygons,
  } : {
    totalAreaSqm: 0,
    carpetAreaSqm: 0,
    circulationRatio: 0,
    requiredCirculationRatio: 0.25,
    nearestFireExitDistanceM: 0,
    maxAllowedEgressDistanceM: 30.0,
    polygons: [],
  });

  const coordinates = scenarioData?.gpsCoords.match(/(-?\d+(?:\.\d+)?)°?\s*N,\s*(-?\d+(?:\.\d+)?)°?\s*E/i);

  const defaultExif: EXIFGeoData = institution?.layer5?.geotagPhoto || (scenarioData ? {
    latitude: coordinates ? Number(coordinates[1]) : 0,
    longitude: coordinates ? Number(coordinates[2]) : 0,
    altitudeMeters: 0,
    captureDevice: 'Illustrative scenario data',
    timestamp: 'Scenario sample',
    distanceFromPlotCentroidMeters: scenarioData.gpsDistanceMeters,
    surveyToleranceMeters: 150,
    geofenceValid: scenarioData.geofenceValid,
    hasGPS: true,
    geofenceStatus: scenarioData.geofenceValid ? 'VALID_SAMPLE' : 'GEOFENCE_EXCEEDED_SAMPLE',
    streetAddress: scenarioData.gpsCoords,
  } : {
    latitude: 0,
    longitude: 0,
    altitudeMeters: 0,
    captureDevice: 'Not available',
    timestamp: 'Not available',
    distanceFromPlotCentroidMeters: null,
    surveyToleranceMeters: 150.0,
    geofenceValid: null,
    hasGPS: false,
    geofenceStatus: 'NO_PHOTO',
    streetAddress: 'Not available - no photo uploaded',
  });

  const defaultYolo: YOLOAsset[] = scenarioData?.yoloDetections || institution?.layer5?.yoloDetections || [];

  // Dynamic state populated from real backend API calls
  const [cadFloorPlan, setCadFloorPlan] = useState(defaultCad);
  const [scaleAvailable, setScaleAvailable] = useState(Boolean(scenarioData || institution?.layer5?.cadFloorPlan));
  const [geotagPhoto, setGeotagPhoto] = useState<EXIFGeoData>(defaultExif);
  const [yoloDetections, setYoloDetections] = useState<YOLOAsset[]>(defaultYolo);

  const [selectedPolygon, setSelectedPolygon] = useState<CADPolygon | null>(
    defaultCad.polygons[0] || null
  );
  const [selectedAsset, setSelectedAsset] = useState<YOLOAsset | null>(
    defaultYolo[0] || null
  );
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);

  // Upload & Pipeline Status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [scaleAnnotation, setScaleAnnotation] = useState<string>(
    scenarioData ? 'Illustrative scenario geometry' : institution?.layer5?.cadFloorPlan ? 'Simulated sample geometry' : 'Scale not supplied; measurements unavailable'
  );
  const [merkleLeafHash, setMerkleLeafHash] = useState<string>('');
  const [advisoryNotes, setAdvisoryNotes] = useState<string[]>([]);
  const [copiedHash, setCopiedHash] = useState(false);

  // File Input Refs
  const cadInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 1. Handle CAD Floor Plan PDF Upload
  const handleCADUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsProcessing(true);
    setProcessingStage('PyMuPDF vector extraction & Shapely polygon calculation...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('page_index', '0');

    try {
      const response = await fetch(`${BACKEND_BASE}/api/v1/layer5-vision/analyze-cad`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: CAD analysis failed.`);
      }

      const data = await response.json();
      const hasScale = Boolean(data.scale_info?.scale_available);
      setScaleAvailable(hasScale);
      if (data.cadFloorPlan && hasScale) {
        setCadFloorPlan({
          totalAreaSqm: data.cadFloorPlan.totalAreaSqm,
          carpetAreaSqm: data.cadFloorPlan.carpetAreaSqm,
          circulationRatio: data.cadFloorPlan.circulationRatio,
          requiredCirculationRatio: data.cadFloorPlan.requiredCirculationRatio,
          nearestFireExitDistanceM: data.cadFloorPlan.nearestFireExitDistanceM,
          maxAllowedEgressDistanceM: data.cadFloorPlan.maxAllowedEgressDistanceM,
          polygons: data.cadFloorPlan.polygons.map((p: any) => ({
            id: p.id,
            roomName: p.roomName,
            category: p.category as any,
            areaSqm: p.areaSqm,
            calculatedBy: p.calculatedBy,
            points: p.points,
            status: p.status as any,
          })),
        });

        if (data.cadFloorPlan.polygons.length > 0) {
          setSelectedPolygon(data.cadFloorPlan.polygons[0]);
        }

        if (data.scale_info) {
          setScaleAnnotation(hasScale
            ? `Scale: Text Detected (${data.scale_info.scale_source || 'verified source'})`
            : 'Scale unavailable; no area or distance calculations performed');
        }

        if (!hasScale) {
          setCadFloorPlan({ ...defaultCad, polygons: [] });
          setSelectedPolygon(null);
          setMerkleLeafHash('');
        }

        setAdvisoryNotes([...(data.advisory_flags || []), ...(data.limitations || [])]);

        if (data.merkle_leaf_hash) {
          setMerkleLeafHash(data.merkle_leaf_hash);
        }
      }
    } catch (err: any) {
      console.warn('CAD upload fallback:', err.message);
      setScaleAvailable(false);
      setScaleAnnotation('CAD analysis unavailable; measurements not assessed');
      setCadFloorPlan({ ...defaultCad, polygons: [] });
      setSelectedPolygon(null);
      setMerkleLeafHash('');
      setAdvisoryNotes([`CAD analysis could not be completed: ${err.message}`]);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  // 2. Handle Facility Photo Upload (EXIF + YOLO Inference)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(previewUrl);

    setIsProcessing(true);
    setProcessingStage('Extracting EXIF Geotag metadata & running YOLOv8n asset detection...');

    // A. Run EXIF Inspection
    const exifData = new FormData();
    exifData.append('file', file);

    // B. Run YOLO Detection
    const yoloData = new FormData();
    yoloData.append('file', file);
    yoloData.append('confidence_threshold', '0.25');

    try {
      const [exifRes, yoloRes] = await Promise.all([
        fetch(`${BACKEND_BASE}/api/v1/layer5-vision/inspect-exif`, {
          method: 'POST',
          body: exifData,
        }),
        fetch(`${BACKEND_BASE}/api/v1/layer5-vision/detect-assets`, {
          method: 'POST',
          body: yoloData,
        }),
      ]);

      if (exifRes.ok) {
        const exifJson = await exifRes.json();
        if (exifJson.geotagPhoto) {
          setGeotagPhoto({
            latitude: exifJson.geotagPhoto.latitude,
            longitude: exifJson.geotagPhoto.longitude,
            altitudeMeters: exifJson.geotagPhoto.altitudeMeters,
            captureDevice: exifJson.geotagPhoto.captureDevice,
            timestamp: exifJson.geotagPhoto.timestamp,
            distanceFromPlotCentroidMeters:
              exifJson.geotagPhoto.distanceFromPlotCentroidMeters,
            surveyToleranceMeters: exifJson.geotagPhoto.surveyToleranceMeters,
            geofenceValid: exifJson.geotagPhoto.geofenceValid,
            hasGPS: Boolean(exifJson.geotagPhoto.hasGPS),
            geofenceStatus: exifJson.geotagPhoto.geofenceStatus || 'INCONCLUSIVE',
            streetAddress: exifJson.geotagPhoto.streetAddress,
          });
        }
      }

      if (yoloRes.ok) {
        const yoloJson = await yoloRes.json();
        if (yoloJson.yoloDetections && yoloJson.yoloDetections.length > 0) {
          setYoloDetections(
            yoloJson.yoloDetections.map((d: any) => ({
              id: d.id,
              label: d.label,
              confidence: d.confidence,
              bbox: d.bbox,
              requiredQty: d.requiredQty,
              detectedQty: d.detectedQty,
              compliant: d.compliant,
            }))
          );
          setSelectedAsset(yoloJson.yoloDetections[0]);
        }
        if (yoloJson.merkle_leaf_hash) {
          setMerkleLeafHash(yoloJson.merkle_leaf_hash);
        }
      }
    } catch (err: any) {
      console.warn('Photo processing fallback:', err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const handleCopyMerkleHash = () => {
    navigator.clipboard.writeText(merkleLeafHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const isCirculationCompliant = scaleAvailable && cadFloorPlan.circulationRatio >= cadFloorPlan.requiredCirculationRatio;
  const hasMeasuredEgress = cadFloorPlan.nearestFireExitDistanceM != null;
  const isFireEgressCompliant = scaleAvailable && hasMeasuredEgress && cadFloorPlan.nearestFireExitDistanceM! <= cadFloorPlan.maxAllowedEgressDistanceM;

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Hidden File Inputs */}
      <input
        ref={cadInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleCADUpload}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Header Banner & Live Pipeline Toolbar */}
      <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                LAYER 5 • COMPUTER VISION & GEOMETRY
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                PyMuPDF Vector CAD Engine • Pillow GNSS EXIF Validator • Ultralytics YOLOv8-Nano
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Infrastructure Computer Vision & Spatial Geometry Module
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              {scenarioData
                ? 'Illustrative sample geometry, geolocation, and equipment findings for the selected walkthrough. These values are prefilled examples, not measurements from an uploaded plan or photo.'
                : 'Extracts room boundaries from supplied floor plans, reads available photo metadata, and can run equipment detection on uploaded facility images.'}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => cadInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF4E8] hover:bg-[#F5E6C8] text-[#4A1504] border border-[#D4AF37]/60 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#4A1504]" />
              <span>Upload CAD Plan (PDF)</span>
            </button>

            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF4E8] hover:bg-[#F5E6C8] text-[#4A1504] border border-[#D4AF37]/60 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Camera className="w-3.5 h-3.5 text-[#4A1504]" />
              <span>Upload Facility Photo</span>
            </button>

            {/* Geofence Status Badge */}
            <div
              className={`p-3 rounded-xl border text-right min-w-[120px] ${
                geotagPhoto.geofenceValid === true
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : geotagPhoto.geofenceValid === false
                    ? 'bg-red-50 text-red-800 border-red-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold opacity-75 block">
                Geofence Status
              </span>
              <span className="font-mono font-extrabold text-xs">
                {geotagPhoto.geofenceValid === true
                  ? 'VALID WITHIN TOLERANCE'
                  : geotagPhoto.geofenceValid === false
                    ? 'OUTSIDE TOLERANCE'
                    : geotagPhoto.hasGPS ? 'REFERENCE UNAVAILABLE' : 'INCONCLUSIVE · NO GPS'}
              </span>
            </div>
          </div>
        </div>

        {/* Processing Loader Indicator */}
        {isProcessing && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-[#4A1504]" />
            <span className="font-semibold">{processingStage || 'Analyzing multi-modal assets...'}</span>
          </div>
        )}
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Vector CAD Floor Plan (Shapely Engine) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#4A1504]" />
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                    {scenarioData ? 'Illustrative Scenario Geometry' : 'Vector CAD Floor Plan Geometry (Shapely Engine)'}
                  </h3>
                  <span className="text-[10px] text-[#2B1609]/60 block font-mono">
                    {scaleAnnotation}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#4A1504] bg-[#FAF4E8] px-2.5 py-1 rounded-lg border border-[#D4AF37]/40">
                Total: {scaleAvailable ? `${cadFloorPlan.totalAreaSqm.toLocaleString()} m²` : 'Not assessed'}
              </span>
            </div>

            {/* Interactive SVG Floor Plan Canvas */}
            <div className="relative w-full aspect-[4/3] bg-[#FAF4E8] rounded-xl border-2 border-[#D4AF37]/40 shadow-inner overflow-hidden select-none p-3">
              {!scaleAvailable && <div className="absolute z-10 inset-0 flex items-center justify-center bg-[#FAF4E8]/80 text-center p-8 text-sm font-semibold text-[#4A1504]">Upload a floor plan with a verifiable scale to assess geometry. No areas or distances are inferred.</div>}
              <svg className="w-full h-full" viewBox="0 0 620 460">
                {/* Grid guidelines */}
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="0.5"
                      opacity="0.25"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* CAD Polygons rendered dynamically */}
                {cadFloorPlan.polygons.map((poly) => {
                  const isSelected = selectedPolygon?.id === poly.id;
                  const isPass = poly.status === 'PASS';

                  let fill = 'rgba(74, 21, 4, 0.12)';
                  let stroke = '#4A1504';

                  if (poly.category === 'INSTRUCTIONAL') {
                    fill = 'rgba(16, 185, 129, 0.16)';
                    stroke = '#059669';
                  } else if (poly.category === 'CIRCULATION') {
                    fill = isPass ? 'rgba(59, 130, 246, 0.16)' : 'rgba(239, 68, 68, 0.18)';
                    stroke = isPass ? '#2563EB' : '#DC2626';
                  } else if (poly.category === 'FIRE_EGRESS') {
                    fill = isPass ? 'rgba(245, 158, 11, 0.16)' : 'rgba(239, 68, 68, 0.22)';
                    stroke = isPass ? '#D97706' : '#DC2626';
                  }

                  const firstCoord = poly.points.split(' ')[0] || '50,50';
                  const [labelX, labelY] = firstCoord.split(',').map(Number);

                  return (
                    <g
                      key={poly.id}
                      onClick={() => setSelectedPolygon(poly)}
                      className="cursor-pointer transition-opacity hover:opacity-90"
                    >
                      <polygon
                        points={poly.points}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={isSelected ? '3' : '1.5'}
                        strokeDasharray={poly.status === 'DEFICIENT' ? '4 2' : undefined}
                      />
                      {/* Room Label */}
                      <text
                        x={labelX + 8}
                        y={labelY + 22}
                        fill="#2B1609"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {poly.roomName} ({poly.areaSqm} m²)
                      </text>
                    </g>
                  );
                })}

                {/* Fire exit travel route line */}
              </svg>
            </div>

            {/* Selected Room Metadata Card */}
            {selectedPolygon && (
              <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/40 text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#4A1504]">
                  <span>{selectedPolygon.roomName}</span>
                  <span
                    className={
                    selectedPolygon.status === 'PASS' ? 'text-emerald-700' : selectedPolygon.status === 'UNASSESSED' ? 'text-amber-700' : 'text-red-700'
                    }
                  >
                    {selectedPolygon.status === 'UNASSESSED' ? 'Not assessed'
                      : selectedPolygon.status === 'PASS'
                      ? 'Compliant Area'
                      : 'Deficient / Shortfall'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#2B1609]/80 font-mono">
                  <span>Category: {selectedPolygon.category}</span>
                  <span>
                    {selectedPolygon.areaSqm} m² ({selectedPolygon.calculatedBy})
                  </span>
                </div>
              </div>
            )}

            {/* Circulation and Fire Egress Norms */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-0.5">
                <span className="text-[10px] text-[#2B1609]/60 block font-semibold">
                  Circulation Area Ratio
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    !scaleAvailable ? 'text-amber-700' : isCirculationCompliant ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {scaleAvailable ? `${(cadFloorPlan.circulationRatio * 100).toFixed(1)}% (Req: ${(cadFloorPlan.requiredCirculationRatio * 100).toFixed(0)}%)` : 'Not assessed'}
                </span>
                <span className="text-[9px] text-[#2B1609]/60 block">
                  {!scaleAvailable ? 'Requires a verified drawing scale' : isCirculationCompliant ? 'Meets configured guideline' : 'Below configured threshold'}
                </span>
              </div>

              <div className="p-2.5 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-0.5">
                <span className="text-[10px] text-[#2B1609]/60 block font-semibold">
                  Max Fire Egress Travel
                </span>
                <span
                  className={`font-mono font-bold text-sm ${
                    !scaleAvailable || !hasMeasuredEgress ? 'text-amber-700' : isFireEgressCompliant ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {scaleAvailable && hasMeasuredEgress ? `${cadFloorPlan.nearestFireExitDistanceM}m (Max: ${cadFloorPlan.maxAllowedEgressDistanceM}m)` : 'Not assessed'}
                </span>
                <span className="text-[9px] text-[#2B1609]/60 block">
                  {!scaleAvailable ? 'Requires a verified drawing scale' : !hasMeasuredEgress ? 'Exit geometry and route are not assessed' : isFireEgressCompliant ? 'Within configured limit' : 'Exceeds configured limit'}
                </span>
              </div>
            </div>
          </div>

          {/* EXIF Geotag Photo Geospatial Validator */}
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm space-y-3">
            <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              EXIF Geotag Campus Photo Geospatial Validator (Pillow)
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">GNSS Coordinates:</span>
                <span className="font-mono font-bold text-[#4A1504]">
                  {geotagPhoto.hasGPS ? `${geotagPhoto.latitude.toFixed(4)}°, ${geotagPhoto.longitude.toFixed(4)}°` : 'Not present in image metadata'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Capture Hardware:</span>
                <span className="font-medium text-[#2B1609]">{geotagPhoto.captureDevice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Distance from Plot Centroid:</span>
                <span
                  className={`font-mono font-bold ${
                    geotagPhoto.geofenceValid === true ? 'text-emerald-700' : geotagPhoto.geofenceValid === false ? 'text-red-700' : 'text-amber-700'
                  }`}
                >
                  {geotagPhoto.distanceFromPlotCentroidMeters == null ? 'Not calculated' : `${geotagPhoto.distanceFromPlotCentroidMeters.toFixed(1)}m (Tolerance: ${geotagPhoto.surveyToleranceMeters}m)`}
                </span>
              </div>
              <p className="text-[11px] text-[#2B1609]/80 italic pt-1 border-t border-[#D4AF37]/20 font-mono">
                "{geotagPhoto.streetAddress}"
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: YOLO Asset Detection Grid */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-[#4A1504]" />
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                    {scenarioData ? 'Illustrative Equipment Findings' : 'YOLOv8 Facility Machinery & Safety Detection'}
                  </h3>
                  <span className="text-[10px] text-[#2B1609]/60 block font-mono">
                    {scenarioData ? 'Prefilled sample outputs · no image inference' : 'Ultralytics YOLOv8n (COCO-80 Multi-Modal)'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBBoxes(!showBBoxes)}
                className="px-2.5 py-1 bg-[#FAF4E8] border border-[#D4AF37]/50 rounded-lg text-[11px] text-[#4A1504] font-medium cursor-pointer hover:bg-[#F5E6C8] transition-all"
              >
                {showBBoxes ? 'Hide BBoxes' : 'Show BBoxes'}
              </button>
            </div>

            {/* Live Lab Inspection Photo with YOLO Bounding Boxes */}
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-[#D4AF37]/40 shadow-md bg-stone-900">
              {scenarioData && !photoPreviewUrl && (
                <span className="absolute left-3 top-3 z-30 rounded-md border border-amber-300/70 bg-black/80 px-2.5 py-1 text-[9px] font-bold tracking-wide text-amber-200">
                  SAMPLE DETECTIONS · NO PHOTO UPLOADED
                </span>
              )}
              {/* If user uploaded a photo, display it; scenario overlays are explicitly labeled as samples. */}
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt="Uploaded Lab Inspection"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 flex flex-col items-center justify-center p-4">
                  <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
                  <Camera className="w-10 h-10 text-stone-600 mb-2" />
                  <span className="font-mono text-stone-400 text-xs text-center select-none max-w-xs">
                    {scenarioData ? 'ILLUSTRATIVE FACILITY SCENARIO' : 'UPLOAD A FACILITY PHOTO TO VIEW IMAGE EVIDENCE'}
                  </span>
                </div>
              )}

              {/* Rendered YOLO Bounding Boxes */}
              {showBBoxes &&
                yoloDetections.map((asset) => {
                  const [ymin, xmin, ymax, xmax] = asset.bbox;
                  const isSelected = selectedAsset?.id === asset.id;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        top: `${ymin}%`,
                        left: `${xmin}%`,
                        height: `${Math.max(8, ymax - ymin)}%`,
                        width: `${Math.max(10, xmax - xmin)}%`,
                      }}
                      className={`absolute rounded border-2 cursor-pointer transition-all flex flex-col justify-between p-1 text-[10px] font-mono ${
                        asset.compliant
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                          : 'border-red-500 bg-red-500/25 text-red-100'
                      } ${isSelected ? 'ring-2 ring-white scale-[1.02] z-20' : 'z-10'}`}
                    >
                      <div className="flex items-center justify-between bg-black/75 px-1 py-0.5 rounded text-[9px]">
                        <span className="font-bold truncate max-w-[90px]">{asset.label}</span>
                        <span>{(asset.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-right text-[8px] bg-black/65 px-1 py-0.5 rounded self-end">
                        Req: {asset.requiredQty} | Det: {asset.detectedQty}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Asset Table Breakdown */}
            <div className="space-y-2 pt-2">
              <h4 className="font-cinzel font-bold text-xs text-[#4A1504] uppercase tracking-wider flex items-center justify-between">
                <span>Mandatory Lab Machinery Inventory Audit</span>
                <span className="text-[10px] font-mono font-normal text-[#2B1609]/70">
                  {yoloDetections.length} Classified Bays
                </span>
              </h4>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {yoloDetections.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-3 transition-all ${
                      selectedAsset?.id === asset.id
                        ? 'bg-[#FAF4E8] border-[#4A1504] font-semibold text-[#4A1504]'
                        : 'bg-white/70 hover:bg-[#FAF4E8]/60 border-[#D4AF37]/30 text-[#2B1609]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {asset.compliant ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{asset.label}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-[#2B1609]/70">
                        Detected: <strong>{asset.detectedQty}</strong> / {asset.requiredQty}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          asset.compliant
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {asset.compliant ? 'COMPLIANT' : 'SHORTFALL'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Findings & Layer 6 Cryptographic Merkle Leaf Seal */}
      <div className="p-5 rounded-2xl bg-[#FAF4E8] border border-[#D4AF37] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#D4AF37]/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4A1504]" />
            <h4 className="font-cinzel font-bold text-sm text-[#4A1504]">
              Layer 5 Multi-Modal Advisory Findings & Audit Digest
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMerkleHash}
              disabled={!merkleLeafHash}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#D4AF37]/50 rounded-lg text-xs font-mono text-[#4A1504] hover:bg-[#F5E6C8] cursor-pointer"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Merkle Leaf</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Advisory Notes List */}
        <div className="space-y-1.5 text-xs text-[#2B1609]/90">
          {advisoryNotes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5 shrink-0" />
              <span>{note}</span>
            </div>
          ))}
        </div>

        {/* Cryptographic Hash Bar */}
        <div className="pt-2 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono">
          <span className="text-[#2B1609]/70">Layer 6 Merkle Leaf Pre-Commit Hash:</span>
          <span className="font-bold text-[#4A1504] truncate max-w-md" title={merkleLeafHash}>
            {merkleLeafHash || 'Not generated'}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            {merkleLeafHash ? 'DIGEST GENERATED' : 'NOT GENERATED'}
          </span>
        </div>
      </div>
    </div>
  );
};
