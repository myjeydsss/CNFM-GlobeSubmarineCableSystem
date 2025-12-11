import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import { useDeletedCables } from '../../../../hooks/useApi';

type RoutePoint = {
  km: number;
  lat: number | null;
  lng: number | null;
  depth: number | null;
  cableType: string | null;
};

type SegmentStore = {
  coords: RoutePoint[];
  meta: RoutePoint[];
};

type SegmentData = {
  id: string; // S1, S2...
  label: string;
  endpoint: string;
};

const SEGMENTS: SegmentData[] = [
  {
    id: 'S1',
    label: 'S1 - Kauditan',
    endpoint: '/sea-us-rpl-s1'
  },
  {
    id: 'S2',
    label: 'S2 - Davao',
    endpoint: '/sea-us-rpl-s2'
  },
  {
    id: 'S3',
    label: 'S3 - Piti - BU Davao City',
    endpoint: '/sea-us-rpl-s3'
  },
  {
    id: 'S4',
    label: 'S4 - Piti - Hawaii BU',
    endpoint: '/sea-us-rpl-s4'
  },
  {
    id: 'S5',
    label: 'S5 - Makaha, Hawaii',
    endpoint: '/sea-us-rpl-s5'
  },
  {
    id: 'S6',
    label: 'S6 - Hermosa, USA',
    endpoint: '/sea-us-rpl-s6'
  }
];

const parseNumber = (value: any): number | null => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

const extractLatLng = (item: any) => {
  const lat =
    parseNumber(item.full_latitude) ??
    parseNumber(item.decimal_latitude) ??
    parseNumber(item.latitude);
  const lng =
    parseNumber(item.full_longitude) ??
    parseNumber(item.decimal_longitude) ??
    parseNumber(item.longitude);
  const depth =
    parseNumber(item.Depth) ??
    parseNumber(item.depth) ??
    parseNumber(item.approx_depth);
  const cableType =
    typeof item.cable_type === 'string' ? item.cable_type.trim() || null : null;
  return { lat, lng, depth, cableType };
};

const CutSeaUS: React.FC = () => {
  const map = useMap();
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const cutMarkersRef = useRef<Record<string, L.Marker>>({});
  const [open, setOpen] = useState(false);
  const [routes, setRoutes] = useState<Record<string, SegmentStore>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startSegment, setStartSegment] = useState<string>('');
  const [endSegment, setEndSegment] = useState<string>('');
  const [targetKm, setTargetKm] = useState<number>(0);
  const [targetKmInput, setTargetKmInput] = useState<string>('');
  const [cutType, setCutType] = useState<string>('');
  const [faultDate, setFaultDate] = useState<string>('');
  const [faultTime, setFaultTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [distanceError, setDistanceError] = useState<string>('');

  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
  const port = process.env.REACT_APP_PORT || ':8081';
  const { refetch: refetchDeletedCables } = useDeletedCables();

  useEffect(() => {
    map.attributionControl.remove();
    const control = L.control({ position: 'bottomright' });
    buttonContainerRef.current = L.DomUtil.create('div');
    control.onAdd = () => {
      const container = L.DomUtil.create('div');
      container.appendChild(buttonContainerRef.current as HTMLDivElement);
      return container;
    };
    control.addTo(map);
    return () => {
      map.removeControl(control);
      Object.values(cutMarkersRef.current).forEach((m) => map.removeLayer(m));
    };
  }, [map]);

  // Fetch all segment routes
  useEffect(() => {
    let isMounted = true;
    const fetchRoutes = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const results = await Promise.all(
          SEGMENTS.map(async (seg) => {
            const res = await fetch(`${apiBaseUrl}${port}${seg.endpoint}`);
            if (!res.ok)
              throw new Error(`Failed to fetch ${seg.endpoint}: ${res.status}`);
            const data = await res.json();
            const meta: RoutePoint[] = (Array.isArray(data) ? data : [])
              .map((item: any) => {
                const km =
                  parseNumber(item.cable_cumulative_total) ??
                  parseNumber(item.cumulative_total) ??
                  parseNumber(item.cable_between_positions);
                const { lat, lng, depth, cableType } = extractLatLng(item);
                if (km == null || !Number.isFinite(km)) return null;
                return {
                  km,
                  lat: lat ?? null,
                  lng: lng ?? null,
                  depth: depth ?? null,
                  cableType: cableType ?? null
                };
              })
              .filter(Boolean) as RoutePoint[];

            const coords = meta.filter(
              (p) =>
                p.lat != null &&
                p.lng != null &&
                Number.isFinite(p.lat as number) &&
                Number.isFinite(p.lng as number)
            );

            coords.sort((a, b) => a.km - b.km);
            meta.sort((a, b) => a.km - b.km);
            return { id: seg.id, store: { coords, meta } as SegmentStore };
          })
        );

        if (!isMounted) return;
        const merged: Record<string, SegmentStore> = {};
        results.forEach(({ id, store }) => {
          merged[id] = store;
        });
        setRoutes(merged);
      } catch (err: any) {
        if (isMounted) {
          setLoadError(
            err?.message || 'Unable to load SEA-US routes for simulation.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRoutes();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, port]);

  const getSegmentLength = (segmentId: string) => {
    if (!segmentId) return 0;
    const pts = routes[segmentId]?.meta || [];
    if (!pts.length) return 0;
    return pts[pts.length - 1].km;
  };

  const totalSpan = useMemo(() => {
    const lenA = startSegment ? getSegmentLength(startSegment) : 0;
    const lenB =
      startSegment && endSegment && startSegment !== endSegment
        ? getSegmentLength(endSegment)
        : 0;
    return lenA + lenB;
  }, [startSegment, endSegment, routes]);

  useEffect(() => {
    // Reset to start of span when selection or data changes
    setTargetKm(0);
    setTargetKmInput('');
  }, [startSegment, endSegment, totalSpan]);

  const clampTarget = (val: number) => {
    if (totalSpan <= 0) return 0;
    return Math.min(Math.max(val, 0), totalSpan);
  };

  const combineDateTime = (dateStr: string, timeStr: string) => {
    const today = new Date();
    const datePart = dateStr || today.toISOString().slice(0, 10);
    const timePart =
      timeStr ||
      `${String(today.getHours()).padStart(2, '0')}:${String(
        today.getMinutes()
      ).padStart(2, '0')}`;
    return `${datePart}T${timePart}`;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  };

  const formatDisplayTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const resolveSegmentForKm = (km: number) => {
    if (!startSegment) return null;
    const lenA = getSegmentLength(startSegment);
    if (!endSegment || startSegment === endSegment || km <= lenA) {
      return { segmentId: startSegment, localKm: km };
    }
    const localKm = km - lenA;
    return { segmentId: endSegment, localKm };
  };

  const getNearestCableType = (
    pts: RoutePoint[],
    km: number
  ): string | null => {
    if (!pts.length) return null;
    let best: { type: string; diff: number; isForward: boolean } | null = null;

    for (let i = 0; i < pts.length; i++) {
      const type = pts[i].cableType;
      if (!type) continue;
      const diff = Math.abs(pts[i].km - km);
      const isForward = pts[i].km >= km;
      if (
        best === null ||
        diff < best.diff ||
        (diff === best.diff && isForward && !best.isForward) // prefer forward on tie
      ) {
        best = { type, diff, isForward };
      }
    }

    return best ? best.type : null;
  };

  const getInterpolatedDepth = (
    pts: RoutePoint[],
    km: number
  ): number | null => {
    if (!pts.length) return null;
    let prev: { km: number; depth: number } | null = null;
    let next: { km: number; depth: number } | null = null;

    for (let i = 0; i < pts.length; i++) {
      if (
        pts[i].depth != null &&
        Number.isFinite(pts[i].depth as number) &&
        pts[i].km <= km
      ) {
        prev = { km: pts[i].km, depth: pts[i].depth as number };
      }
      if (
        pts[i].depth != null &&
        Number.isFinite(pts[i].depth as number) &&
        pts[i].km >= km
      ) {
        next = { km: pts[i].km, depth: pts[i].depth as number };
        break;
      }
    }

    if (prev && next) {
      if (prev.km === next.km) return prev.depth;
      const ratio = (km - prev.km) / (next.km - prev.km);
      return prev.depth + ratio * (next.depth - prev.depth);
    }
    if (next) return next.depth;
    if (prev) return prev.depth;
    return null;
  };

  const shouldMirrorSegment = (segmentId: string, a: string, b: string) => {
    // Only apply matrix for S1-S5; S6 and unknowns remain normal
    const mirrorMap: Record<string, Record<string, { a: boolean; b: boolean }>> =
      {
        S1: {
          S2: { a: false, b: true },
          S3: { a: false, b: true },
          S4: { a: false, b: false },
          S5: { a: false, b: true }
        },
        S2: {
          S1: { a: false, b: true },
          S3: { a: false, b: true },
          S4: { a: false, b: false },
          S5: { a: false, b: true }
        },
        S3: {
          S1: { a: false, b: true },
          S2: { a: false, b: true },
          S4: { a: true, b: false },
          S5: { a: true, b: true }
        },
        S4: {
          S1: { a: true, b: true },
          S2: { a: true, b: true },
          S3: { a: true, b: false },
          S5: { a: false, b: true }
        },
        S5: {
          S1: { a: false, b: true },
          S2: { a: false, b: true },
          S3: { a: false, b: false },
          S4: { a: false, b: true }
        }
      };

    const rulesForA = mirrorMap[a];
    const pairRule = rulesForA ? rulesForA[b] : undefined;
    if (!pairRule) return false;
    if (segmentId === a) return pairRule.a;
    if (segmentId === b) return pairRule.b;
    return false;
  };

  const interpolatePoint = (
    segmentId: string,
    km: number
  ): RoutePoint | null => {
    const store = routes[segmentId];
    if (!store) return null;
    const coords = store.coords;
    const meta = store.meta;
    if (!meta.length || !coords.length) return null;

    const segLen = getSegmentLength(segmentId);
    const kmClamped = Math.min(Math.max(km, 0), segLen);
    const shouldMirror = shouldMirrorSegment(segmentId, startSegment, endSegment);
    const kmForLookup = shouldMirror
      ? Math.max(0, segLen - kmClamped)
      : kmClamped;

    const cableType = getNearestCableType(meta, kmForLookup);
    const depthInterp = getInterpolatedDepth(meta, kmForLookup);
    if (kmForLookup <= coords[0].km)
      return { ...coords[0], cableType, depth: depthInterp ?? coords[0].depth };
    if (kmForLookup >= coords[coords.length - 1].km)
      return {
        ...coords[coords.length - 1],
        cableType,
        depth: depthInterp ?? coords[coords.length - 1].depth
      };

    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      if (kmForLookup <= curr.km) {
        const ratio = (kmForLookup - prev.km) / (curr.km - prev.km || 1);
        const lat =
          (prev.lat as number) +
          ratio * ((curr.lat as number) - (prev.lat as number));
        const lng =
          (prev.lng as number) +
          ratio * ((curr.lng as number) - (prev.lng as number));
        const depth = depthInterp ?? prev.depth ?? curr.depth ?? null;
        return { km, lat, lng, depth, cableType };
      }
    }
    return null;
  };

  const preview = useMemo(() => {
    if (totalSpan <= 0) return null;
    const bounded = clampTarget(targetKm);
    const { segmentId, localKm } = resolveSegmentForKm(bounded);
    const point = interpolatePoint(segmentId, localKm);
    if (!point) return null;
    return { ...point, _sourceSegment: segmentId };
  }, [targetKm, totalSpan, routes, startSegment, endSegment]);

  const addMarkerToMap = (
    cutId: string,
    lat: number,
    lng: number,
    info: {
      distance: number;
      depth: number | string | null;
      cutType: string;
      faultDate: string;
      cableType: string | null;
    }
  ) => {
    if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (cutMarkersRef.current[cutId]) {
      map.removeLayer(cutMarkersRef.current[cutId]);
    }
    const depthDisplay =
      typeof info.depth === 'number'
        ? info.depth.toFixed(1)
        : info.depth ?? 'Unknown';
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'cut-marker-seaus',
        html: `
          <div style="
            position: relative;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              color: #B71C1C;
              font-size: 16px;
              font-weight: bold;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(255,255,255,0.8);
              line-height: 1;
            ">✕</div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(map);
    cutMarkersRef.current[cutId] = marker;

    const popupHtml = `
      <div style="width: 260px; font-family: Arial, sans-serif; box-shadow: 0 2px 6px rgba(0,0,0,0.2); border-radius: 6px; overflow: hidden;">
        <div style="background:#B71C1C; color:white; padding:10px; text-align:center; font-weight:700; letter-spacing:0.5px;">
          ${info.cutType.toUpperCase()}
        </div>
        <div style="background:white; padding:12px;">
          <table style="width:100%; font-size:13px; border-collapse:collapse;">
            <tr><td style="font-weight:700; padding:6px 0;">Distance:</td><td style="text-align:right; padding:6px 0;">${info.distance.toFixed(
              3
            )} km</td></tr>
            <tr><td style="font-weight:700; padding:6px 0;">Depth:</td><td style="text-align:right; padding:6px 0;">${depthDisplay} m</td></tr>
            <tr><td style="font-weight:700; padding:6px 0;">Lat:</td><td style="text-align:right; padding:6px 0;">${lat.toFixed(
              6
            )}</td></tr>
            <tr><td style="font-weight:700; padding:6px 0;">Lng:</td><td style="text-align:right; padding:6px 0;">${lng.toFixed(
              6
            )}</td></tr>
            <tr><td style="font-weight:700; padding:6px 0;">Date:</td><td style="text-align:right; padding:6px 0;">${formatDisplayDate(
              info.faultDate
            )}</td></tr>
            <tr><td style="font-weight:700; padding:6px 0;">Time:</td><td style="text-align:right; padding:6px 0;">${
              formatDisplayTime(info.faultDate) || 'N/A'
            }</td></tr>
            <tr><td style="font-weight:700; padding:6px 0;">Cable Type:</td><td style="text-align:right; padding:6px 0;">${
              info.cableType || 'Unknown'
            }</td></tr>
          </table>
        </div>
      </div>
    `;
    marker.bindPopup(popupHtml, {
      className: 'cnfm-cut-popup',
      closeButton: false,
      autoClose: false,
      closeOnClick: false
    });

    map.flyTo([lat, lng], 7.7, { animate: true, duration: 0.5 });
  };

  const handleOpen = () => {
    setStartSegment('');
    setEndSegment('');
    setTargetKm(0);
    setTargetKmInput('');
    setCutType('');
    setDistanceError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!startSegment) {
      setToast({
        open: true,
        message: 'Please select Point A segment.',
        severity: 'error'
      });
      return;
    }
    if (!endSegment) {
      setToast({
        open: true,
        message: 'Please select Point B segment.',
        severity: 'error'
      });
      return;
    }
    if (!cutType) {
      setToast({
        open: true,
        message: 'Please select a cut type.',
        severity: 'error'
      });
      return;
    }
    if (distanceError) {
      setToast({
        open: true,
        message: distanceError,
        severity: 'error'
      });
      return;
    }
    if (totalSpan <= 0) {
      setToast({
        open: true,
        message: 'No route data available for the selected segments.',
        severity: 'error'
      });
      return;
    }
    const bounded = clampTarget(targetKm);
    const point = preview;
    if (!point) {
      setToast({
        open: true,
        message:
          'Unable to calculate cut location. Please adjust your selection.',
        severity: 'error'
      });
      return;
    }

    const srcSeg = (preview as any)?._sourceSegment || startSegment;
    const segNum = (srcSeg.match(/\d+/) || ['1'])[0];
    const cutId = `seaus${segNum}-${Date.now()}`;
    const depth = point.depth ?? 'Unknown';
    const cableType = point.cableType ?? 'Unknown';

    const combinedFaultDate = combineDateTime(faultDate, faultTime);

    const payload = {
      cut_id: cutId,
      distance: Number(bounded.toFixed(3)),
      cut_type: cutType,
      fault_date: combinedFaultDate,
      simulated: new Date().toISOString(),
      latitude: point.lat,
      longitude: point.lng,
      depth,
      cable_type: cableType,
      cableType,
      cable: 'sea-us',
      segment: `s${segNum}`,
      source_table: `sea_us_rpl_s${segNum}`
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}${port}/cable-cuts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const duplicateMsg =
          'This cable cut already exists. Duplicate entries are not allowed.';
        const isDup =
          res.status === 409 ||
          result?.error === 'Duplicate Entry' ||
          /duplicate/i.test(result?.message || '');
        const msg = isDup
          ? duplicateMsg
          : result?.message || `Server error: ${res.status}`;
        setToast({ open: true, message: msg, severity: 'error' });
        setSubmitting(false);
        return;
      }
      addMarkerToMap(cutId, point.lat, point.lng, {
        distance: payload.distance,
        depth: depth,
        cutType: cutType,
        faultDate: payload.fault_date,
        cableType: cableType
      });
      refetchDeletedCables();
      setToast({
        open: true,
        message: 'Cable cut simulated successfully.',
        severity: 'success'
      });
      handleClose();
    } catch (err: any) {
      console.error('Error saving cut:', err);
      setToast({
        open: true,
        message: err?.message || 'Unable to save the simulated cut.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isDataReady = useMemo(
    () => Object.keys(routes).length === SEGMENTS.length,
    [routes]
  );
  const lenA = getSegmentLength(startSegment);
  const lenB = startSegment === endSegment ? 0 : getSegmentLength(endSegment);

  const loadingContent = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <CircularProgress size={18} />
      <Typography variant="body2">Loading SEA-US route data…</Typography>
    </Box>
  );

  const dialogContent = (
    <>
      <Button
        variant="contained"
        sx={{
          backgroundColor: '#2e7d32',
          fontSize: '12px',
          '&:hover': { backgroundColor: '#1b5e20' }
        }}
        startIcon={<ContentCutIcon />}
        onClick={handleOpen}
      >
        Cut SEA-US Cable
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ mt: 2 }}>
          <Typography variant="h5">Simulate SEA-US Cable Fault</Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {loading ? (
            loadingContent
          ) : loadError ? (
            <Typography color="error" variant="body2">
              {loadError}
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="start-seg-label">Point A</InputLabel>
                <Select
                  labelId="start-seg-label"
                  label="Point A"
                  value={startSegment}
                  onChange={(e) => setStartSegment(e.target.value as string)}
                >
                  <MenuItem value="" disabled>
                    Select Point A
                  </MenuItem>
                  {SEGMENTS.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="end-seg-label">Point B</InputLabel>
                <Select
                  labelId="end-seg-label"
                  label="Point B"
                  value={endSegment}
                  onChange={(e) => setEndSegment(e.target.value as string)}
                >
                  <MenuItem value="" disabled>
                    Select Point B
                  </MenuItem>
                  {SEGMENTS.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Target Distance (km)
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Point A length: {lenA ? `${lenA.toFixed(3)} km` : '--'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Point B length: {lenB ? `${lenB.toFixed(3)} km` : '--'}
                  </Typography>
                </Box>
                <TextField
                  label="Target Distance (km)"
                  type="number"
                  value={targetKmInput}
                  onChange={(e) => {
                    const { value } = e.target;
                    setTargetKmInput(value);
                    const parsed = parseFloat(value);
                    if (Number.isFinite(parsed)) {
                      const clamped = clampTarget(parsed);
                      setTargetKm(clamped);
                      if (parsed < 0 || parsed > totalSpan) {
                        setDistanceError(
                          `Target must be within 0 and ${totalSpan.toFixed(
                            3
                          )} km.`
                        );
                      } else {
                        setDistanceError('');
                      }
                    } else {
                      setDistanceError('Enter a valid number.');
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(targetKmInput);
                    const next = Number.isFinite(parsed)
                      ? clampTarget(parsed)
                      : clampTarget(targetKm);
                    setTargetKm(next);
                    setTargetKmInput(
                      Number.isFinite(next) ? next.toFixed(3) : ''
                    );
                    if (
                      !Number.isFinite(parsed) ||
                      parsed < 0 ||
                      parsed > totalSpan
                    ) {
                      setDistanceError(
                        `Target must be within 0 and ${totalSpan.toFixed(
                          3
                        )} km.`
                      );
                    } else {
                      setDistanceError('');
                    }
                  }}
                  error={!!distanceError}
                  helperText={
                    distanceError ||
                    (totalSpan
                      ? `Range: 0 → ${totalSpan.toFixed(
                          3
                        )} km Across Selected Points`
                      : 'Select Points to Enable Range')
                  }
                  inputProps={{
                    min: 0,
                    max: totalSpan || undefined,
                    step: 0.001
                  }}
                />
                {preview && (
                  <Typography variant="caption" color="text.secondary">
                    Preview: {preview.lat.toFixed(6)}, {preview.lng.toFixed(6)}{' '}
                    (depth:{' '}
                    {preview.depth != null &&
                    Number.isFinite(preview.depth as number)
                      ? Number(preview.depth).toFixed(1)
                      : 'Unknown'}
                    {preview.cableType ? `, cable type: ${preview.cableType}` : ''}
                    )
                  </Typography>
                )}
              </Box>

              <TextField
                label="Fault Date"
                type="date"
                value={faultDate}
                onChange={(e) => setFaultDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Fault Time"
                type="time"
                value={faultTime}
                onChange={(e) => setFaultTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Cut Type"
                select
                value={cutType}
                onChange={(e) => setCutType(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select cut type
                </MenuItem>
                <MenuItem value="Shunt Fault">Shunt Fault</MenuItem>
                <MenuItem value="Partial Fiber Break">
                  Partial Fiber Break
                </MenuItem>
                <MenuItem value="Fiber Break">Fiber Break</MenuItem>
                <MenuItem value="Full Cut">Full Cut</MenuItem>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting || loading || totalSpan === 0 || !isDataReady}
          >
            {submitting ? 'Saving...' : 'Cut Cable'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  const toastPortal =
    typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <Snackbar
            open={toast.open}
            autoHideDuration={4000}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              severity={toast.severity}
              onClose={() => setToast((prev) => ({ ...prev, open: false }))}
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>,
          document.body
        )
      : null;

  return (
    <>
      {toastPortal}
      {buttonContainerRef.current
        ? ReactDOM.createPortal(dialogContent, buttonContainerRef.current)
        : null}
    </>
  );
};

export default CutSeaUS;
