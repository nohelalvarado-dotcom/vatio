import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Camera,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
} from 'lucide-react';
import { AnalyticsDataset, PeriodMetrics, ThreeChartType, DataTraceabilityInfo } from '../../../types/atlas';
import { OriginBadge } from '../../../components/ui/OriginBadge';

interface ThreeEnergyCanvasProps {
  dataset: AnalyticsDataset;
  chartType: ThreeChartType;
  onInspectPoint?: (info: DataTraceabilityInfo) => void;
}

interface HoveredPointInfo {
  label: string;
  category: string;
  value: number;
  unit: string;
  origin: 'MEDIDO' | 'DECLARADO' | 'CALCULADO' | 'ESTIMADO' | 'PREDICHO' | 'NO_VERIFICADO';
  periodId: string;
  x: number;
  y: number;
}

export const ThreeEnergyCanvas: React.FC<ThreeEnergyCanvasProps> = ({
  dataset,
  chartType,
  onInspectPoint,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPointInfo | null>(null);

  // References to keep Three.js scene instances across re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const interactiveBarsRef = useRef<Array<{ mesh: THREE.Mesh; data: any }>>([]);
  const animFrameIdRef = useRef<number>(0);
  const requestRenderRef = useRef<() => void>(() => {});

  // Software WebGL detection
  const isSoftwareGl = useRef<boolean>(false);

  useEffect(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) {
      isSoftwareGl.current = true;
    } else {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl.current = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    }
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0B1220');
    scene.fog = new THREE.FogExp2('#0B1220', 0.015);
    sceneRef.current = scene;

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(12, 10, 16);
    cameraRef.current = camera;

    // 3. WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl.current,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Needed for screenshot capture
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl.current ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl.current;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Empty container before appending
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl.current;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controls.target.set(0, 1.5, 0);
    controlsRef.current = controls;

    // 5. Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting Rig
    const ambientLight = new THREE.HemisphereLight('#E2E8F0', '#0F1728', 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#FFFFFF', 1.8);
    dirLight.position.set(10, 16, 8);
    dirLight.castShadow = !isSoftwareGl.current;
    if (dirLight.castShadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 40;
      dirLight.shadow.bias = -0.0005;
    }
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight('#35D39A', 0.9);
    rimLight.position.set(-10, 8, -10);
    scene.add(rimLight);

    // 7. Render on demand loop with damping
    let isRendering = false;
    const requestRender = () => {
      if (isRendering) return;
      isRendering = true;
      animFrameIdRef.current = requestAnimationFrame(() => {
        isRendering = false;
        controls.update();
        renderer.render(scene, camera);
      });
    };
    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
      requestRender();
    });
    resizeObserver.observe(container);

    // Initial render
    requestRender();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      controls.removeEventListener('change', requestRender);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Build Procedural 3D Visualizations whenever dataset or chartType changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous visual objects except lights
    const toRemove: THREE.Object3D[] = [];
    scene.children.forEach(child => {
      if (child.type !== 'HemisphereLight' && child.type !== 'DirectionalLight') {
        toRemove.push(child);
      }
    });
    toRemove.forEach(obj => {
      scene.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
    });

    interactiveBarsRef.current = [];

    const { periods, currency } = dataset;
    if (periods.length === 0) {
      requestRenderRef.current();
      return;
    }

    // 1. Grid Floor
    const gridHelper = new THREE.GridHelper(24, 24, '#24364D', '#141F32');
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Ground reflector / shadow receiver plane
    const planeGeo = new THREE.PlaneGeometry(28, 28);
    const planeMat = new THREE.MeshStandardMaterial({
      color: '#0B1220',
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(planeGeo, planeMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = !isSoftwareGl.current;
    scene.add(ground);

    // 2. Geometry Builder based on Chart Type
    const count = periods.length;
    const spacingX = Math.min(2.2, 16 / Math.max(count, 1));
    const startX = -((count - 1) * spacingX) / 2;

    // Materials Palette
    const emeraldMat = new THREE.MeshStandardMaterial({
      color: '#35D39A',
      roughness: 0.25,
      metalness: 0.2,
      emissive: '#093623',
    });
    const cyanMat = new THREE.MeshStandardMaterial({
      color: '#42C7D9',
      roughness: 0.3,
      metalness: 0.3,
      emissive: '#0A2D35',
    });
    const amberMat = new THREE.MeshStandardMaterial({
      color: '#F1B653',
      roughness: 0.3,
      metalness: 0.2,
      emissive: '#3D2808',
    });
    const coralMat = new THREE.MeshStandardMaterial({
      color: '#F07676',
      roughness: 0.35,
      metalness: 0.15,
      emissive: '#381313',
    });
    const indigoMat = new THREE.MeshStandardMaterial({
      color: '#6366F1',
      roughness: 0.3,
      metalness: 0.2,
      emissive: '#16193E',
    });

    const maxKwh = Math.max(...periods.map(p => p.consumptionKwh), 1);
    const maxSpend = Math.max(...periods.map(p => p.totalCost), 1);
    const maxEffectiveCost = Math.max(...periods.map(p => p.effectiveCostPerKwh), 1);
    const targetHeight = 5.0; // max 3D bar height

    periods.forEach((p, i) => {
      const posX = startX + i * spacingX;

      if (chartType === 'consumption-3d') {
        // Single Energy Active Bar (kWh) + Daily line point
        const h = Math.max(0.1, (p.consumptionKwh / maxKwh) * targetHeight);
        const geo = new THREE.BoxGeometry(spacingX * 0.65, h, 0.9);
        const bar = new THREE.Mesh(geo, emeraldMat.clone());
        bar.position.set(posX, h / 2, 0);
        bar.castShadow = !isSoftwareGl.current;
        bar.receiveShadow = !isSoftwareGl.current;
        scene.add(bar);

        interactiveBarsRef.current.push({
          mesh: bar,
          data: {
            label: p.periodLabel,
            category: 'Consumo Eléctrico',
            value: p.consumptionKwh,
            unit: 'kWh',
            origin: p.dataOrigin,
            periodId: p.invoiceId,
            periodMetrics: p,
          },
        });

        // Cap highlight disc
        const capGeo = new THREE.CylinderGeometry(spacingX * 0.25, spacingX * 0.25, 0.08, 16);
        const cap = new THREE.Mesh(capGeo, cyanMat);
        cap.position.set(posX, h + 0.04, 0);
        scene.add(cap);

      } else if (chartType === 'spend-3d') {
        // Spend Bar in Currency
        const h = Math.max(0.1, (p.totalCost / maxSpend) * targetHeight);
        const geo = new THREE.BoxGeometry(spacingX * 0.65, h, 0.9);
        const bar = new THREE.Mesh(geo, amberMat.clone());
        bar.position.set(posX, h / 2, 0);
        bar.castShadow = !isSoftwareGl.current;
        bar.receiveShadow = !isSoftwareGl.current;
        scene.add(bar);

        interactiveBarsRef.current.push({
          mesh: bar,
          data: {
            label: p.periodLabel,
            category: 'Gasto Facturado',
            value: p.totalCost,
            unit: currency,
            origin: p.dataOrigin,
            periodId: p.invoiceId,
            periodMetrics: p,
          },
        });

      } else if (chartType === 'components-3d') {
        // 3D Multi-segment Stacked Pillars: Energy (Emerald), Fixed (Coral), Taxes (Amber), Street Lighting (Cyan)
        const total = p.totalCost || 1;
        const hEnergy = Math.max(0.05, (p.energyCharge / maxSpend) * targetHeight);
        const hFixed = Math.max(0.05, (p.fixedCharge / maxSpend) * targetHeight);
        const hTaxes = Math.max(0.05, (p.taxes / maxSpend) * targetHeight);
        const hStreet = Math.max(0.05, (p.streetLighting / maxSpend) * targetHeight);

        // 1. Energy Base
        const gEnergy = new THREE.BoxGeometry(spacingX * 0.6, hEnergy, 0.8);
        const bEnergy = new THREE.Mesh(gEnergy, emeraldMat.clone());
        bEnergy.position.set(posX, hEnergy / 2, 0);
        scene.add(bEnergy);
        interactiveBarsRef.current.push({
          mesh: bEnergy,
          data: {
            label: `${p.periodLabel} - Energía`,
            category: 'Costo Energía',
            value: p.energyCharge,
            unit: currency,
            origin: 'DECLARADO',
            periodId: p.invoiceId,
            periodMetrics: p,
          },
        });

        // 2. Fixed Charge
        const gFixed = new THREE.BoxGeometry(spacingX * 0.6, hFixed, 0.8);
        const bFixed = new THREE.Mesh(gFixed, coralMat.clone());
        bFixed.position.set(posX, hEnergy + hFixed / 2, 0);
        scene.add(bFixed);
        interactiveBarsRef.current.push({
          mesh: bFixed,
          data: {
            label: `${p.periodLabel} - Cargo Fijo`,
            category: 'Cargo Fijo',
            value: p.fixedCharge,
            unit: currency,
            origin: 'DECLARADO',
            periodId: p.invoiceId,
            periodMetrics: p,
          },
        });

        // 3. Taxes
        const gTaxes = new THREE.BoxGeometry(spacingX * 0.6, hTaxes, 0.8);
        const bTaxes = new THREE.Mesh(gTaxes, amberMat.clone());
        bTaxes.position.set(posX, hEnergy + hFixed + hTaxes / 2, 0);
        scene.add(bTaxes);
        interactiveBarsRef.current.push({
          mesh: bTaxes,
          data: {
            label: `${p.periodLabel} - Impuestos`,
            category: 'Tributos e IVA',
            value: p.taxes,
            unit: currency,
            origin: 'DECLARADO',
            periodId: p.invoiceId,
            periodMetrics: p,
          },
        });

      } else if (chartType === 'category-3d') {
        // Period (X) vs Category Rows along Z-axis
        // Climatización (Z=-1.5), Cocina (Z=-0.5), Agua Caliente (Z=0.5), Iluminación (Z=1.5)
        const categories = [
          { name: 'Climatización', factor: 0.45, color: '#37BDD0' },
          { name: 'Cocina', factor: 0.25, color: '#EBAA44' },
          { name: 'Agua Caliente', factor: 0.20, color: '#D95D5D' },
          { name: 'Iluminación', factor: 0.10, color: '#31B77A' },
        ];

        categories.forEach((cat, cIdx) => {
          const catKwh = Math.round(p.consumptionKwh * cat.factor * 10) / 10;
          const h = Math.max(0.1, (catKwh / (maxKwh * 0.5)) * targetHeight);
          const cGeo = new THREE.BoxGeometry(spacingX * 0.5, h, 0.6);
          const cMat = new THREE.MeshStandardMaterial({
            color: cat.color,
            roughness: 0.3,
            metalness: 0.2,
          });
          const cMesh = new THREE.Mesh(cGeo, cMat);
          const posZ = (cIdx - 1.5) * 1.2;
          cMesh.position.set(posX, h / 2, posZ);
          scene.add(cMesh);

          interactiveBarsRef.current.push({
            mesh: cMesh,
            data: {
              label: `${p.periodLabel} · ${cat.name}`,
              category: `Categoría: ${cat.name}`,
              value: catKwh,
              unit: 'kWh (Est.)',
              origin: 'ESTIMADO',
              periodId: p.invoiceId,
              periodMetrics: p,
            },
          });
        });

      } else if (chartType === 'unit-cost-3d' || chartType === 'matrix-3d' || chartType === 'comparison-3d') {
        // Effective Cost per kWh Bar (₡/kWh)
        const h = Math.max(0.1, (p.effectiveCostPerKwh / maxEffectiveCost) * targetHeight);
        const geo = new THREE.BoxGeometry(spacingX * 0.6, h, 0.8);
        const bar = new THREE.Mesh(geo, cyanMat.clone());
        bar.position.set(posX, h / 2, 0);
        scene.add(bar);

        interactiveBarsRef.current.push({
          mesh: bar,
          data: {
            label: p.periodLabel,
            category: 'Costo Medio Unitario Efectivo',
            value: p.effectiveCostPerKwh,
            unit: `${currency}/kWh`,
            origin: 'CALCULADO',
            periodId: p.invoiceId,
            periodMetrics: p,
          },
        });
      }
    });

    requestRenderRef.current();
  }, [dataset, chartType]);

  // Raycasting for interactive hover and tooltip
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    if (!container || !camera || interactiveBarsRef.current.length === 0) return;

    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);

    const meshes = interactiveBarsRef.current.map(b => b.mesh);
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const matched = interactiveBarsRef.current.find(b => b.mesh === hitMesh);
      if (matched) {
        setHoveredPoint({
          label: matched.data.label,
          category: matched.data.category,
          value: matched.data.value,
          unit: matched.data.unit,
          origin: matched.data.origin,
          periodId: matched.data.periodId,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        return;
      }
    }
    setHoveredPoint(null);
  }, []);

  // Camera Presets
  const setCameraPreset = (preset: 'isometric' | 'front' | 'top') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === 'isometric') {
      camera.position.set(12, 10, 16);
      controls.target.set(0, 1.5, 0);
    } else if (preset === 'front') {
      camera.position.set(0, 4, 18);
      controls.target.set(0, 2, 0);
    } else if (preset === 'top') {
      camera.position.set(0, 22, 0.01);
      controls.target.set(0, 0, 0);
    }
    controls.update();
    requestRenderRef.current();
  };

  // Reset Camera
  const resetCamera = () => {
    setCameraPreset('isometric');
  };

  // Capture Canvas Screenshot
  const handleCaptureScreenshot = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    // Render immediately before capture
    renderer.render(scene, camera);
    const canvas = renderer.domElement;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `vatio-atlas-3d-${chartType}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Toggle Fullscreen on Container
  const toggleFullscreen = () => {
    const container = mountRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Handle clicking hovered point to open Traceability
  const handleInspectHovered = () => {
    if (!hoveredPoint || !onInspectPoint) return;
    const period = dataset.periods.find(p => p.invoiceId === hoveredPoint.periodId);
    if (!period) return;

    onInspectPoint({
      metricName: hoveredPoint.category,
      value: hoveredPoint.value.toLocaleString(),
      unit: hoveredPoint.unit,
      formula:
        hoveredPoint.unit === 'kWh'
          ? 'Consumo = Lectura Actual - Lectura Anterior × Multiplicador Medidor'
          : hoveredPoint.unit.includes('/kWh')
          ? 'Costo Unitario Efectivo = Total Declarado / Consumo Total (kWh)'
          : 'Total = ∑ (Cargos de Energía + Fijos + Tributos + Ajustes)',
      provenance: hoveredPoint.origin,
      sourceInvoiceId: period.invoiceId,
      sourceInvoiceNumber: period.invoiceId,
      periodDates: `${period.periodStart} al ${period.periodEnd}`,
      underlyingInputs: [
        { label: 'Días Facturados', value: `${period.billingDays} días` },
        { label: 'Distribuidora', value: period.distributor },
        { label: 'Consumo Ciclo', value: `${period.consumptionKwh} kWh` },
        { label: 'Importe Ciclo', value: `${period.currency}${period.totalCost.toLocaleString()}` },
      ],
      explanation:
        'Registro auditado en IndexedDB con comprobación aritmética y trazabilidad dimensional en VATIO.',
    });
  };

  return (
    <div className="relative w-full h-[480px] lg:h-[540px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0B1220] shadow-inner select-none">
      {/* Three.js Canvas Mount */}
      <div
        ref={mountRef}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left Title and Active Mode Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-bold tracking-wide">
            {chartType === 'consumption-3d' && 'Evolución 3D de Consumo Activo'}
            {chartType === 'spend-3d' && 'Trayectoria 3D de Gasto Financiero'}
            {chartType === 'components-3d' && 'Desglose 3D de Componentes de Factura'}
            {chartType === 'category-3d' && 'Matriz 3D de Consumo por Categoría'}
            {chartType === 'unit-cost-3d' && 'Superficie 3D de Costo Efectivo por kWh'}
            {chartType === 'matrix-3d' && 'Matriz Tridimensional de Magnitudes'}
            {chartType === 'comparison-3d' && 'Comparativa 3D de Periodos'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            ({dataset.periods.length} periodos)
          </span>
        </div>
      </div>

      {/* Interactive Hover HUD Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            left: `${Math.min(hoveredPoint.x + 16, 680)}px`,
            top: `${Math.max(hoveredPoint.y - 60, 20)}px`,
          }}
          className="absolute z-20 pointer-events-auto p-3 rounded-xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 text-white shadow-2xl transition-all duration-75 min-w-[210px]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              {hoveredPoint.label}
            </span>
            <OriginBadge origin={hoveredPoint.origin} />
          </div>
          <p className="text-xs text-slate-300 mt-0.5">{hoveredPoint.category}</p>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {hoveredPoint.value.toLocaleString()} <span className="text-xs text-slate-400">{hoveredPoint.unit}</span>
          </div>
          {onInspectPoint && (
            <button
              type="button"
              onClick={handleInspectHovered}
              className="mt-2 w-full py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-[10px] text-cyan-200 font-semibold border border-cyan-500/40 transition flex items-center justify-center gap-1"
            >
              <Info className="w-3 h-3" />
              <span>Ver origen del dato</span>
            </button>
          )}
        </div>
      )}

      {/* Ergonomic Bottom Control Dock (Three.js skill directive: zero viewport occlusion) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 transition-all duration-300 max-w-[95%] sm:max-w-xl w-full ${
          isControlsCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse toggle tab */}
        <div className="flex justify-center mb-1">
          <button
            type="button"
            onClick={() => setIsControlsCollapsed(prev => !prev)}
            className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-[10px] text-slate-300 hover:text-white flex items-center gap-1 shadow-md transition"
          >
            {isControlsCollapsed ? (
              <>
                <ChevronUp className="w-3 h-3 text-cyan-400" />
                <span>Mostrar Controles 3D</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-slate-400" />
                <span>Ocultar Barra</span>
              </>
            )}
          </button>
        </div>

        {/* Dock Controls Container */}
        <div className="p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
          {/* Camera Presets */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => setCameraPreset('isometric')}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition"
              title="Perspectiva Isométrica"
            >
              Isométrica
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('front')}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition"
              title="Vista Frontal"
            >
              Frontal
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('top')}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-700 text-[11px] font-medium text-slate-200 transition"
              title="Vista Superior"
            >
              Planta
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={resetCamera}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition"
              title="Restablecer Posición de Cámara"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCaptureScreenshot}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold text-[11px] transition flex items-center gap-1.5 border border-emerald-500/50"
              title="Exportar Captura en Alta Resolución"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar PNG</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition"
              title={isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
